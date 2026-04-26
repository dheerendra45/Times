"""Project service — CRUD with filtering and pagination."""

import math
from datetime import datetime
from bson import ObjectId

from app.database import get_db
from app.models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectFilters,
    TeamMember,
)


def _serialize_project(doc: dict) -> ProjectResponse:
    """Convert a MongoDB document to a ProjectResponse."""
    return ProjectResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        problem_statement=doc["problem_statement"],
        solution=doc["solution"],
        domain=doc["domain"],
        tech_stack=doc.get("tech_stack", []),
        team_members=[TeamMember(**m) for m in doc.get("team_members", [])],
        presentation_url=doc.get("presentation_url"),
        demo_url=doc.get("demo_url"),
        repo_url=doc.get("repo_url"),
        thumbnail_url=doc.get("thumbnail_url"),
        award=doc.get("award", "none"),
        submitted_by=str(doc.get("submitted_by", "")),
        created_at=doc.get("created_at", datetime.utcnow()),
        updated_at=doc.get("updated_at", datetime.utcnow()),
    )


async def create_project(data: ProjectCreate, user_id: str) -> ProjectResponse:
    """Create a new project."""
    db = get_db()
    now = datetime.utcnow()

    doc = {
        **data.model_dump(),
        "team_members": [m.model_dump() for m in data.team_members],
        "submitted_by": ObjectId(user_id),
        "created_at": now,
        "updated_at": now,
    }

    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id

    return _serialize_project(doc)


async def get_projects(filters: ProjectFilters) -> ProjectListResponse:
    """List projects with filters and pagination."""
    db = get_db()
    query: dict = {}

    # Text search
    if filters.search:
        query["$text"] = {"$search": filters.search}

    # Domain filter
    if filters.domain:
        query["domain"] = {"$in": filters.domain}

    # Tech stack filter
    if filters.tech_stack:
        query["tech_stack"] = {"$in": filters.tech_stack}

    # Award filter
    if filters.award:
        query["award"] = {"$in": [a.value for a in filters.award]}

    # Count total
    total = await db.projects.count_documents(query)
    total_pages = math.ceil(total / filters.per_page) if total > 0 else 1

    # Fetch paginated results
    skip = (filters.page - 1) * filters.per_page
    cursor = db.projects.find(query).sort("created_at", -1).skip(skip).limit(filters.per_page)
    docs = await cursor.to_list(length=filters.per_page)

    projects = [_serialize_project(doc) for doc in docs]

    result = ProjectListResponse(
        projects=projects,
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        total_pages=total_pages,
    )

    return result


async def get_project_by_id(project_id: str) -> ProjectResponse:
    """Get a single project by ID."""
    db = get_db()
    try:
        doc = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise ValueError("Invalid project ID")

    if not doc:
        raise ValueError("Project not found")

    project = _serialize_project(doc)
    return project


async def update_project(project_id: str, data: ProjectUpdate, user_id: str) -> ProjectResponse:
    """Update a project (only by the submitter)."""
    db = get_db()

    try:
        doc = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise ValueError("Invalid project ID")

    if not doc:
        raise ValueError("Project not found")

    if str(doc["submitted_by"]) != user_id:
        raise PermissionError("You can only edit your own projects")

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "team_members" in update_data and update_data["team_members"]:
        update_data["team_members"] = [m.model_dump() if hasattr(m, "model_dump") else m for m in update_data["team_members"]]

    update_data["updated_at"] = datetime.utcnow()

    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": update_data})

    updated = await db.projects.find_one({"_id": ObjectId(project_id)})
    return _serialize_project(updated)


async def delete_project(project_id: str, user_id: str) -> None:
    """Delete a project (only by the submitter)."""
    db = get_db()

    try:
        doc = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise ValueError("Invalid project ID")

    if not doc:
        raise ValueError("Project not found")

    if str(doc["submitted_by"]) != user_id:
        raise PermissionError("You can only delete your own projects")

    await db.projects.delete_one({"_id": ObjectId(project_id)})


async def get_all_domains() -> list[str]:
    """Get distinct domains for filter dropdowns."""
    db = get_db()
    domains = await db.projects.distinct("domain")
    return sorted(domains)


async def get_all_tech_stacks() -> list[str]:
    """Get distinct tech stacks for filter dropdowns."""
    db = get_db()
    techs = await db.projects.distinct("tech_stack")
    return sorted(techs)
