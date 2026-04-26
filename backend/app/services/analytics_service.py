"""Analytics service — dashboard stats."""

from app.database import get_db


async def get_dashboard_stats() -> dict:
    """
    Compute dashboard stats: total participants, submissions, winners,
    domain breakdown, and tech stack breakdown.
    """
    db = get_db()

    # Total submissions
    total_submissions = await db.projects.count_documents({})

    # Total unique participants (count all team members across projects)
    pipeline_participants = [
        {"$unwind": "$team_members"},
        {"$group": {"_id": "$team_members.email"}},
        {"$count": "total"},
    ]
    participant_result = await db.projects.aggregate(pipeline_participants).to_list(1)
    total_participants = participant_result[0]["total"] if participant_result else 0

    # Winners count
    total_winners = await db.projects.count_documents({"award": "winner"})

    # Runner-ups count
    total_runners_up = await db.projects.count_documents({"award": "runner_up"})

    # Domain breakdown
    domain_pipeline = [
        {"$group": {"_id": "$domain", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15},
    ]
    domain_result = await db.projects.aggregate(domain_pipeline).to_list(15)
    domain_breakdown = [{"domain": d["_id"], "count": d["count"]} for d in domain_result]

    # Tech stack breakdown
    tech_pipeline = [
        {"$unwind": "$tech_stack"},
        {"$group": {"_id": "$tech_stack", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15},
    ]
    tech_result = await db.projects.aggregate(tech_pipeline).to_list(15)
    tech_breakdown = [{"tech": t["_id"], "count": t["count"]} for t in tech_result]

    # Recent submissions (latest 10)
    recent_cursor = db.projects.find({}).sort("created_at", -1).limit(10)
    recent_docs = await recent_cursor.to_list(10)
    recent_submissions = []
    for doc in recent_docs:
        recent_submissions.append({
            "id": str(doc["_id"]),
            "title": doc["title"],
            "domain": doc["domain"],
            "award": doc.get("award", "none"),
            "team_size": len(doc.get("team_members", [])),
            "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
        })

    # Award distribution
    award_pipeline = [
        {"$group": {"_id": "$award", "count": {"$sum": 1}}},
    ]
    award_result = await db.projects.aggregate(award_pipeline).to_list(10)
    award_distribution = {a["_id"]: a["count"] for a in award_result}

    stats = {
        "total_submissions": total_submissions,
        "total_participants": total_participants,
        "total_winners": total_winners,
        "total_runners_up": total_runners_up,
        "domain_breakdown": domain_breakdown,
        "tech_breakdown": tech_breakdown,
        "recent_submissions": recent_submissions,
        "award_distribution": award_distribution,
    }

    return stats
