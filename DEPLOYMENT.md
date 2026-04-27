# Deployment Guide

## Required Environment Variables on Render

Make sure to set these environment variables in your Render dashboard:

### 1. MongoDB

```
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/Times?retryWrites=true&w=majority
MONGO_DB=Times
```

### 2. JWT Authentication

```
JWT_SECRET_KEY=your-secure-random-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 3. AI Provider (Choose ONE)

**Option A: Mistral (Recommended)**

```
LLM_PROVIDER=mistral
MISTRAL_API_KEY=your-mistral-api-key
```

**Option B: OpenAI**

```
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
```

**Option C: Google Gemini**

```
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your-google-api-key
```

### 4. Memory Optimization (IMPORTANT for Free Tier)

**For Render Free Tier (512MB RAM) - Use Simple Search:**

```
USE_SIMPLE_SEARCH=true
ENABLE_FAISS_WARMUP=false
```

**For Paid Plans with More Memory - Use FAISS:**

```
USE_SIMPLE_SEARCH=false
ENABLE_FAISS_WARMUP=true
FAISS_INDEX_PATH=./faiss_index/hackathon.index
EMBEDDING_MODEL=paraphrase-MiniLM-L3-v2
SIMILARITY_THRESHOLD=0.35
```

> **Note:** Simple search uses keyword matching instead of vector embeddings. It's faster and uses ~90% less memory, but slightly less accurate for semantic similarity.
> EMBEDDING_MODEL=all-MiniLM-L6-v2
> SIMILARITY_THRESHOLD=0.35

```

### 5. CORS (Update with your frontend URL)

```

CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000

```

### 6. Optional: Redis (for caching and rate limiting)

```

REDIS_URL=your-redis-url-from-upstash

```

## Deployment Steps

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Set all the environment variables above in Render dashboard
4. Deploy!

## Troubleshooting

### "Web service exceeded memory limit" error?

**This is the most common issue on Render's free tier (512MB RAM).**

**Solution:**
1. Set `USE_SIMPLE_SEARCH=true` in Render environment variables
2. Set `ENABLE_FAISS_WARMUP=false`
3. Redeploy

This switches from vector embeddings (memory-heavy) to keyword search (lightweight).

### ERR_QUIC_PROTOCOL_ERROR or timeout errors?

- The server is taking too long to respond
- First request after cold start can be slow (~30 seconds)
- Make sure `USE_SIMPLE_SEARCH=true` to speed up responses
- Consider upgrading to a paid plan for faster performance

### Chat not responding?

- Check that `USE_SIMPLE_SEARCH=true` is set (for free tier)
- Verify your AI provider API key is correct
- Check the logs for any startup errors
- Ensure MongoDB connection is successful

### Authentication errors?

- Verify `JWT_SECRET_KEY` is set (min 32 characters)
- Check CORS_ORIGINS includes your frontend URL
- Ensure cookies are enabled in browser

### API key errors?

- Verify the API key is valid
- Check you have credits/quota remaining
- Ensure LLM_PROVIDER matches the API key you're using
```
