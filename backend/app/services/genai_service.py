"""GenAI RAG service — FAISS vector search + LLM streaming via SSE."""

import os
import json
import asyncio
import numpy as np
from typing import AsyncGenerator

from app.config import settings
from app.database import get_db

# ═══════════════════════════════════════════════════════════════════
# Lazy-loaded globals
# ═══════════════════════════════════════════════════════════════════
_faiss_index = None
_embedding_model = None
_project_ids: list[str] = []
_project_texts: list[str] = []


def _faiss_metadata_path() -> str:
    """Path for FAISS companion metadata file."""
    base, _ = os.path.splitext(settings.FAISS_INDEX_PATH)
    return f"{base}.meta.json"


def _get_embedding_model():
    """Lazy-load the SentenceTransformer model."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print(f"✅ Loaded embedding model: {settings.EMBEDDING_MODEL}")
    return _embedding_model


def _embed_text(text: str) -> np.ndarray:
    """Embed a single text string."""
    model = _get_embedding_model()
    return model.encode([text], normalize_embeddings=True)[0]


def _embed_texts(texts: list[str]) -> np.ndarray:
    """Embed a batch of text strings."""
    model = _get_embedding_model()
    return model.encode(texts, normalize_embeddings=True, show_progress_bar=False)


async def build_faiss_index() -> int:
    """
    Build or rebuild the FAISS index from all projects in MongoDB.
    Returns the number of indexed projects.
    """
    import faiss

    global _faiss_index, _project_ids, _project_texts

    db = get_db()
    cursor = db.projects.find({})
    docs = await cursor.to_list(length=10000)

    if not docs:
        print("⚠️  No projects found — FAISS index is empty")
        _faiss_index = None
        _project_ids = []
        _project_texts = []
        return 0

    texts = []
    ids = []
    for doc in docs:
        combined = (
            f"Title: {doc['title']}\n"
            f"Problem: {doc.get('problem_statement', '')}\n"
            f"Solution: {doc.get('solution', '')}\n"
            f"Tech Stack: {', '.join(doc.get('tech_stack', []))}\n"
            f"Domain: {doc.get('domain', '')}"
        )
        texts.append(combined)
        ids.append(str(doc["_id"]))

    # Run embedding in a thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    embeddings = await loop.run_in_executor(None, _embed_texts, texts)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # Inner product (cosine with normalized vectors)
    index.add(embeddings.astype(np.float32))

    _faiss_index = index
    _project_ids = ids
    _project_texts = texts

    # Save index to disk
    os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH) or ".", exist_ok=True)
    faiss.write_index(index, settings.FAISS_INDEX_PATH)

    with open(_faiss_metadata_path(), "w", encoding="utf-8") as f:
        json.dump({"project_ids": ids, "project_texts": texts}, f)

    print(f"✅ FAISS index built with {len(ids)} projects (dim={dim})")
    return len(ids)


async def _ensure_faiss_ready() -> None:
    """Load FAISS index/metadata from disk or rebuild if needed."""
    import faiss

    global _faiss_index, _project_ids, _project_texts

    if _faiss_index is not None and _project_ids and _project_texts:
        return

    metadata_path = _faiss_metadata_path()
    if os.path.exists(settings.FAISS_INDEX_PATH) and os.path.exists(metadata_path):
        try:
            index = faiss.read_index(settings.FAISS_INDEX_PATH)
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)

            ids = metadata.get("project_ids") or []
            texts = metadata.get("project_texts") or []

            if len(ids) != len(texts) or index.ntotal != len(ids):
                raise ValueError("FAISS metadata does not match index size")

            _faiss_index = index
            _project_ids = ids
            _project_texts = texts
            print(f"✅ Loaded FAISS index from disk with {len(ids)} projects")
            return
        except Exception as e:
            print(f"⚠️  Failed to load FAISS index from disk: {e}")

    await build_faiss_index()


async def search_similar_projects(query: str, top_k: int = 5) -> list[dict]:
    """
    Search for similar projects using FAISS.
    Returns list of {project_id, text, score}.
    """
    import faiss

    await _ensure_faiss_ready()

    if _faiss_index is None or len(_project_ids) == 0:
        return []

    loop = asyncio.get_event_loop()
    query_vec = await loop.run_in_executor(None, _embed_text, query)
    query_vec = query_vec.astype(np.float32).reshape(1, -1)

    distances, indices = _faiss_index.search(query_vec, min(top_k, len(_project_ids)))

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0:
            continue
        results.append({
            "project_id": _project_ids[idx],
            "text": _project_texts[idx],
            "score": float(dist),
        })

    return results


async def stream_rag_response(
    query: str,
    project_context: str = None,
    history: list[dict[str, str]] | None = None,
    session_id: str = None,
    user_id: str = None,
) -> AsyncGenerator[str, None]:
    """
    RAG pipeline: embed query → FAISS top-5 → build prompt → stream LLM response.
    Yields SSE-formatted chunks and saves assistant response to chat history.
    """
    # Step 1: Search for relevant projects
    similar = await search_similar_projects(query, top_k=5)

    # Step 2: Build context
    context_parts = []
    if project_context:
        context_parts.append(f"Current Project Context:\n{project_context}")

    high_similarity = [s for s in similar if s["score"] >= settings.SIMILARITY_THRESHOLD]

    if high_similarity:
        context_parts.append("Relevant Hackathon Projects:")
        for i, s in enumerate(high_similarity, 1):
            context_parts.append(f"\n--- Project {i} (similarity: {s['score']:.2f}) ---\n{s['text']}")

    context = "\n\n".join(context_parts) if context_parts else ""

    # Step 3: Build prompt
    system_prompt = (
        "You are an intelligent assistant for a Hackathon Management Portal. "
        "You help users understand hackathon projects, compare solutions, and provide insights. "
        "Be concise, helpful, and reference specific projects when relevant. "
        "If the context contains relevant project information, cite it in your response. "
        "Use markdown formatting for better readability."
    )

    if context:
        user_prompt = f"Context:\n{context}\n\nUser Question: {query}"
    else:
        user_prompt = f"User Question: {query}\n\n(No specific project context available — provide a general helpful response)"

    if history:
        recent_turns = [
            h for h in history[-8:] if h.get("role") in {"user", "assistant"} and h.get("content")
        ]
        if recent_turns:
            convo = "\n".join(
                f"{turn['role'].capitalize()}: {turn['content']}" for turn in recent_turns
            )
            user_prompt = f"Recent Conversation:\n{convo}\n\n{user_prompt}"

    # Step 4: Stream from LLM and collect response
    full_response = ""
    try:
        if settings.LLM_PROVIDER == "gemini":
            async for chunk in _stream_gemini(system_prompt, user_prompt):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        elif settings.LLM_PROVIDER == "mistral":
            async for chunk in _stream_mistral(system_prompt, user_prompt):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        else:
            async for chunk in _stream_openai(system_prompt, user_prompt):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
    except Exception as e:
        error_msg = str(e)
        full_response = f"[Error: {error_msg}]"
        yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

    # Send sources
    sources_list = []
    if high_similarity:
        sources_list = [{"project_id": s["project_id"], "score": round(s["score"], 3)} for s in high_similarity[:3]]
        yield f"data: {json.dumps({'type': 'sources', 'content': sources_list})}\n\n"

    # Save assistant response to database
    if session_id and user_id and full_response:
        from app.services.chat_service import add_message_to_session
        await add_message_to_session(
            session_id,
            "assistant",
            full_response,
            sources_list if sources_list else None
        )

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


async def _stream_gemini(system_prompt: str, user_prompt: str) -> AsyncGenerator[str, None]:
    """Stream response from Google Gemini."""
    import google.generativeai as genai
    
    if not settings.GOOGLE_API_KEY:
        yield "Error: Google API key not configured. Please contact the administrator."
        return

    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            system_instruction=system_prompt,
        )

        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: model.generate_content(user_prompt, stream=True),
        )

        for chunk in response:
            if chunk.text:
                yield chunk.text
                await asyncio.sleep(0.01)
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Gemini API error: {error_msg}")
        if "401" in error_msg or "unauthorized" in error_msg.lower() or "api_key" in error_msg.lower():
            yield "\n\n⚠️ API authentication failed. Please check the Google API key configuration."
        elif "quota" in error_msg.lower() or "rate" in error_msg.lower():
            yield "\n\n⚠️ Quota exceeded. Please try again later."
        else:
            yield f"\n\n⚠️ Unable to generate response: {error_msg}"


async def _stream_openai(system_prompt: str, user_prompt: str) -> AsyncGenerator[str, None]:
    """Stream response from OpenAI GPT-4o."""
    from openai import OpenAI
    
    if not settings.OPENAI_API_KEY:
        yield "Error: OpenAI API key not configured. Please contact the administrator."
        return

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            max_tokens=1500,
            temperature=0.7,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
                await asyncio.sleep(0.01)
    except Exception as e:
        error_msg = str(e)
        print(f"❌ OpenAI API error: {error_msg}")
        if "401" in error_msg or "unauthorized" in error_msg.lower():
            yield "\n\n⚠️ API authentication failed. Please check the OpenAI API key configuration."
        elif "rate_limit" in error_msg.lower():
            yield "\n\n⚠️ Rate limit exceeded. Please try again in a moment."
        else:
            yield f"\n\n⚠️ Unable to generate response: {error_msg}"


async def _stream_mistral(system_prompt: str, user_prompt: str) -> AsyncGenerator[str, None]:
    """Stream response from Mistral AI."""
    from openai import OpenAI
    
    if not settings.MISTRAL_API_KEY:
        yield "Error: Mistral API key not configured. Please contact the administrator."
        return

    try:
        # Mistral uses OpenAI-compatible API
        client = OpenAI(
            api_key=settings.MISTRAL_API_KEY,
            base_url="https://api.mistral.ai/v1"
        )

        stream = client.chat.completions.create(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            max_tokens=1500,
            temperature=0.7,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
                await asyncio.sleep(0.01)
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Mistral API error: {error_msg}")
        if "401" in error_msg or "unauthorized" in error_msg.lower():
            yield "\n\n⚠️ API authentication failed. Please check the Mistral API key configuration."
        elif "rate_limit" in error_msg.lower():
            yield "\n\n⚠️ Rate limit exceeded. Please try again in a moment."
        else:
            yield f"\n\n⚠️ Unable to generate response: {error_msg}"


async def get_suggested_questions(project_id: str = None) -> list[str]:
    """Return suggested questions, optionally context-aware."""
    base_questions = [
        "What are the most innovative solutions submitted?",
        "Which tech stacks are most commonly used?",
        "Compare the winning projects across domains",
        "What trends do you see in the hackathon submissions?",
        "Summarize the AI/ML projects submitted",
    ]

    if project_id:
        db = get_db()
        from bson import ObjectId
        try:
            project = await db.projects.find_one({"_id": ObjectId(project_id)})
            if project:
                return [
                    f"Explain the solution approach of '{project['title']}'",
                    f"What are the strengths and weaknesses of this project?",
                    f"Compare this with other {project['domain']} projects",
                    f"What improvements could be made to this solution?",
                    f"How does the tech stack ({', '.join(project.get('tech_stack', [])[:3])}) compare to alternatives?",
                ]
        except Exception:
            pass

    return base_questions
