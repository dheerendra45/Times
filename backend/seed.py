"""
Seed script — populates MongoDB with realistic sample hackathon projects.
Run: python seed.py
"""

import asyncio
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Use MongoDB Atlas URI from .env
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "Times")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SAMPLE_USERS = [
    {"username": "alice_dev", "email": "alice@hackathon.io", "full_name": "Alice Chen", "password": "password123"},
    {"username": "bob_builds", "email": "bob@hackathon.io", "full_name": "Bob Sharma", "password": "password123"},
    {"username": "carol_codes", "email": "carol@hackathon.io", "full_name": "Carol Martinez", "password": "password123"},
]

SAMPLE_PROJECTS = [
    {
        "title": "EcoTrack AI — Carbon Footprint Monitor",
        "problem_statement": "Individuals and small businesses lack accessible tools to measure, understand, and reduce their carbon footprint. Existing solutions are expensive, complex, or require manual data entry.",
        "solution": "EcoTrack AI uses computer vision and ML to automatically categorize purchases from receipts, integrates with energy providers via APIs, and provides personalized AI-driven reduction recommendations. A gamified dashboard motivates sustainable behavior with community challenges.",
        "domain": "Sustainability",
        "tech_stack": ["Python", "FastAPI", "TensorFlow", "React", "MongoDB", "GCP"],
        "team_members": [
            {"name": "Alice Chen", "role": "ML Engineer", "email": "alice@hackathon.io"},
            {"name": "Bob Sharma", "role": "Backend Developer", "email": "bob@hackathon.io"},
            {"name": "Carol Martinez", "role": "Frontend Developer", "email": "carol@hackathon.io"},
        ],
        "award": "winner",
        "demo_url": "https://ecotrack-demo.example.com",
        "repo_url": "https://github.com/example/ecotrack",
    },
    {
        "title": "MedBridge — Rural Telemedicine Platform",
        "problem_statement": "Rural communities in developing regions face critical shortages of healthcare professionals. Patients travel hours for basic consultations, leading to delayed diagnoses and preventable deaths.",
        "solution": "MedBridge connects rural health workers with specialist doctors through low-bandwidth video calls optimized for 2G/3G networks. AI triage pre-screens symptoms and prioritizes urgent cases. Offline mode caches treatment protocols for areas with no connectivity.",
        "domain": "Healthcare",
        "tech_stack": ["React Native", "Node.js", "WebRTC", "PostgreSQL", "Redis", "AWS"],
        "team_members": [
            {"name": "David Kim", "role": "Mobile Developer", "email": "david@hackathon.io"},
            {"name": "Emma Wilson", "role": "Backend Engineer", "email": "emma@hackathon.io"},
        ],
        "award": "runner_up",
        "demo_url": "https://medbridge-demo.example.com",
        "repo_url": "https://github.com/example/medbridge",
    },
    {
        "title": "SupplyChain Vision — Defect Detection at Scale",
        "problem_statement": "Manufacturing quality control relies on manual inspection, which is slow, expensive, inconsistent, and cannot scale with production demands. Defective products cause significant revenue loss and brand damage.",
        "solution": "A computer vision pipeline deployed on edge devices detects product defects in real-time at production line speeds. Custom YOLOv8 models trained on client-specific defect types achieve 98.7% accuracy. Integration with ERP systems enables automatic rejection and reporting.",
        "domain": "Manufacturing",
        "tech_stack": ["Python", "PyTorch", "YOLOv8", "FastAPI", "OpenCV", "Raspberry Pi", "MQTT"],
        "team_members": [
            {"name": "Frank Zhang", "role": "CV Engineer", "email": "frank@hackathon.io"},
            {"name": "Grace Patel", "role": "IoT Developer", "email": "grace@hackathon.io"},
            {"name": "Henry Brown", "role": "ML Ops", "email": "henry@hackathon.io"},
        ],
        "award": "winner",
        "repo_url": "https://github.com/example/supplyvision",
    },
    {
        "title": "LearnFlow — Adaptive Microlearning Engine",
        "problem_statement": "Online learning suffers from low completion rates (typically < 15%) due to one-size-fits-all content delivery that ignores individual learning styles, pacing needs, and knowledge gaps.",
        "solution": "LearnFlow uses spaced repetition algorithms and knowledge graph traversal to generate personalized microlearning paths. An LLM dynamically creates quiz questions and explanations adapted to each learner's demonstrated misconceptions.",
        "domain": "Education",
        "tech_stack": ["Vue.js", "Django", "PostgreSQL", "Celery", "OpenAI", "Neo4j"],
        "team_members": [
            {"name": "Iris Johnson", "role": "Full Stack Developer", "email": "iris@hackathon.io"},
            {"name": "Jack Lee", "role": "ML Engineer", "email": "jack@hackathon.io"},
        ],
        "award": "none",
        "demo_url": "https://learnflow-demo.example.com",
    },
    {
        "title": "CrisisMap — Disaster Response Coordination",
        "problem_statement": "During natural disasters, first responders lack real-time situational awareness. Resources are misallocated, volunteers are uncoordinated, and affected individuals cannot efficiently report their location and needs.",
        "solution": "CrisisMap aggregates social media posts, SMS, and satellite imagery to build a live crisis map. AI clusters reports by urgency and type, routing resources optimally. Works with SMS-only for affected populations without internet access.",
        "domain": "Emergency Services",
        "tech_stack": ["React", "FastAPI", "PostgreSQL", "Kafka", "Leaflet.js", "Twilio", "Gemini"],
        "team_members": [
            {"name": "Karen Davis", "role": "Geo Data Engineer", "email": "karen@hackathon.io"},
            {"name": "Liam Thompson", "role": "Backend Developer", "email": "liam@hackathon.io"},
            {"name": "Mia Roberts", "role": "UI/UX Designer", "email": "mia@hackathon.io"},
            {"name": "Noah Anderson", "role": "DevOps", "email": "noah@hackathon.io"},
        ],
        "award": "runner_up",
        "demo_url": "https://crisismap-demo.example.com",
        "repo_url": "https://github.com/example/crisismap",
    },
    {
        "title": "FinLens — SME Cash Flow Predictor",
        "problem_statement": "Small and medium enterprises (SMEs) often run out of cash unexpectedly because they lack tools to forecast cash flow accurately. 82% of business failures are attributed to poor cash flow management.",
        "solution": "FinLens connects to accounting software (QuickBooks, Xero) via APIs and uses LSTM neural networks to forecast 90-day cash flow. Natural language explanations translate financial data into actionable insights for non-financial founders.",
        "domain": "FinTech",
        "tech_stack": ["Python", "TensorFlow", "FastAPI", "React", "PostgreSQL", "Plaid API"],
        "team_members": [
            {"name": "Olivia White", "role": "Data Scientist", "email": "olivia@hackathon.io"},
            {"name": "Peter Garcia", "role": "Full Stack Developer", "email": "peter@hackathon.io"},
        ],
        "award": "none",
        "repo_url": "https://github.com/example/finlens",
    },
    {
        "title": "AccessBridge — Smart Sign Language Interpreter",
        "problem_statement": "Deaf and hard-of-hearing individuals face significant communication barriers in healthcare, legal, and educational settings where professional interpreters are unavailable or unaffordable.",
        "solution": "Real-time sign language recognition using MediaPipe hand tracking and a custom transformer model achieves 94% accuracy across 2,000 ASL signs. A browser extension provides universal sign language support for video calls on any platform.",
        "domain": "Accessibility",
        "tech_stack": ["Python", "PyTorch", "MediaPipe", "WebAssembly", "React", "Chrome Extension API"],
        "team_members": [
            {"name": "Quinn Lewis", "role": "ML Engineer", "email": "quinn@hackathon.io"},
            {"name": "Rachel Hall", "role": "Frontend Developer", "email": "rachel@hackathon.io"},
            {"name": "Sam Young", "role": "Research Lead", "email": "sam@hackathon.io"},
        ],
        "award": "none",
        "demo_url": "https://accessbridge-demo.example.com",
    },
    {
        "title": "AgriSense — Precision Farming with IoT & AI",
        "problem_statement": "Smallholder farmers in water-scarce regions over-irrigate crops due to lack of soil data, wasting up to 60% of water resources and reducing crop yields through root damage.",
        "solution": "Low-cost IoT soil sensors (< $15 each) transmit moisture, pH, and temperature data via LoRaWAN to a cloud platform. ML models recommend optimal irrigation schedules. SMS alerts reach farmers without smartphones.",
        "domain": "Agriculture",
        "tech_stack": ["Arduino", "LoRaWAN", "Python", "TimescaleDB", "Grafana", "Twilio", "scikit-learn"],
        "team_members": [
            {"name": "Tom Martinez", "role": "Hardware Engineer", "email": "tom@hackathon.io"},
            {"name": "Uma Patel", "role": "Data Engineer", "email": "uma@hackathon.io"},
        ],
        "award": "winner",
        "repo_url": "https://github.com/example/agrisense",
    },
    {
        "title": "CodeMentor AI — Pair Programming Assistant",
        "problem_statement": "Junior developers and coding bootcamp students struggle to get timely code reviews and debugging help. Senior engineers are overloaded with mentoring requests, and generic AI tools lack educational context.",
        "solution": "CodeMentor AI provides Socratic-method debugging assistance — instead of giving answers directly, it asks guiding questions to develop problem-solving skills. Tracks learning patterns to identify recurring weaknesses and suggests targeted exercises.",
        "domain": "Developer Tools",
        "tech_stack": ["TypeScript", "Next.js", "OpenAI", "Supabase", "Monaco Editor", "Socket.io"],
        "team_members": [
            {"name": "Victor Chen", "role": "Full Stack Developer", "email": "victor@hackathon.io"},
            {"name": "Wendy Kim", "role": "AI Engineer", "email": "wendy@hackathon.io"},
            {"name": "Xavier Brown", "role": "Product Designer", "email": "xavier@hackathon.io"},
        ],
        "award": "none",
        "demo_url": "https://codementor-demo.example.com",
    },
    {
        "title": "TrustChain — Decentralized Credential Verification",
        "problem_statement": "Academic and professional credential fraud costs institutions billions annually. Verification processes take weeks, are expensive, and rely on centralized databases vulnerable to manipulation.",
        "solution": "Credentials are issued as cryptographically signed NFTs on a permissioned blockchain. Employers scan a QR code for instant, tamper-proof verification without contacting the issuing institution. Zero-knowledge proofs allow attribute disclosure without revealing full credentials.",
        "domain": "Blockchain",
        "tech_stack": ["Solidity", "Ethereum", "IPFS", "React", "Node.js", "Zero-Knowledge Proofs"],
        "team_members": [
            {"name": "Yara Johnson", "role": "Blockchain Developer", "email": "yara@hackathon.io"},
            {"name": "Zane Wilson", "role": "Full Stack Developer", "email": "zane@hackathon.io"},
        ],
        "award": "runner_up",
        "repo_url": "https://github.com/example/trustchain",
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]

    print("🌱 Starting seed...")

    # Clear existing data
    await db.users.delete_many({})
    await db.projects.delete_many({})
    print("🗑️  Cleared existing data")

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.projects.create_index([("title", "text"), ("problem_statement", "text"), ("solution", "text")])
    await db.projects.create_index("domain")
    await db.projects.create_index("tech_stack")
    await db.projects.create_index("award")

    # Insert users
    user_ids = {}
    for u in SAMPLE_USERS:
        # Truncate password to 72 bytes (bcrypt limitation)
        password_bytes = u["password"].encode('utf-8')[:72]
        password_truncated = password_bytes.decode('utf-8', errors='ignore')
        
        doc = {
            "username": u["username"],
            "email": u["email"],
            "full_name": u["full_name"],
            "hashed_password": pwd_context.hash(password_truncated),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
        }
        result = await db.users.insert_one(doc)
        user_ids[u["username"]] = result.inserted_id
        print(f"  👤 Created user: {u['username']}")

    # Insert projects
    user_id_list = list(user_ids.values())
    for i, p in enumerate(SAMPLE_PROJECTS):
        submitted_by = user_id_list[i % len(user_id_list)]
        created_at = datetime.utcnow() - timedelta(days=i * 2)
        doc = {
            **p,
            "submitted_by": submitted_by,
            "created_at": created_at,
            "updated_at": created_at,
        }
        await db.projects.insert_one(doc)
        print(f"  📁 Created project: {p['title']}")

    print(f"\n✅ Seed complete! {len(SAMPLE_USERS)} users, {len(SAMPLE_PROJECTS)} projects inserted.")
    print(f"\nLogin credentials:")
    for u in SAMPLE_USERS:
        print(f"  📧 {u['email']} / password123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
