"""Project routes — CRUD with filters, pagination, and rate limiting."""

from fastapi import APIRouter, HTTPException, Query, Request, status
from typing import Optional

from app.models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectFilters,
    AwardType,
)
from app.services.project_service import (
    create_project,
    get_projects,
    get_project_by_id,
    update_project,
    delete_project,
    get_all_domains,
    get_all_tech_stacks,
)
from app.middleware.rate_limiter import rate_limit_projects

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    request: Request,
    search: Optional[str] = Query(None, max_length=200),
    domain: Optional[str] = Query(None, description="Comma-separated domains"),
    tech_stack: Optional[str] = Query(None, description="Comma-separated techs"),
    award: Optional[str] = Query(None, description="Comma-separated: winner,runner_up,none"),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
):
    """List projects with filtering and pagination. Public endpoint."""
    # Parse comma-separated filter values
    domain_list = [d.strip() for d in domain.split(",")] if domain else None
    tech_list = [t.strip() for t in tech_stack.split(",")] if tech_stack else None
    award_list = None
    if award:
        award_list = []
        for a in award.split(","):
            a = a.strip()
            try:
                award_list.append(AwardType(a))
            except ValueError:
                pass

    filters = ProjectFilters(
        search=search,
        domain=domain_list,
        tech_stack=tech_list,
        award=award_list if award_list else None,
        page=page,
        per_page=per_page,
    )

    return await get_projects(filters)


@router.get("/domains", response_model=list[str])
async def list_domains():
    """Get all distinct domains for filter dropdowns."""
    return await get_all_domains()


@router.get("/tech-stacks", response_model=list[str])
async def list_tech_stacks():
    """Get all distinct tech stacks for filter dropdowns."""
    return await get_all_tech_stacks()


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get a single project by ID. Public endpoint."""
    try:
        return await get_project_by_id(project_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create(
    data: ProjectCreate,
    request: Request,
):
    """Create a new project submission."""
    await rate_limit_projects(request, None)
    return await create_project(data, user_id="anonymous")


@router.put("/{project_id}", response_model=ProjectResponse)
async def update(
    project_id: str,
    data: ProjectUpdate,
    request: Request,
):
    """Update a project."""
    await rate_limit_projects(request, None)
    try:
        return await update_project(project_id, data, user_id="anonymous")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove(
    project_id: str,
    request: Request,
):
    """Delete a project."""
    await rate_limit_projects(request, None)
    try:
        await delete_project(project_id, user_id="anonymous")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
