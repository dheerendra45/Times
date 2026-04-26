"""Project model schemas for CRUD, filtering, and responses."""

from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional
from enum import Enum


class AwardType(str, Enum):
    WINNER = "winner"
    RUNNER_UP = "runner_up"
    NONE = "none"


class TeamMember(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="Member", max_length=50)
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    problem_statement: str = Field(..., min_length=10, max_length=5000)
    solution: str = Field(..., min_length=10, max_length=5000)
    domain: str = Field(..., min_length=2, max_length=100)
    tech_stack: list[str] = Field(..., min_items=1, max_items=20)
    team_members: list[TeamMember] = Field(..., min_items=1, max_items=10)
    presentation_url: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    award: AwardType = AwardType.NONE


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    problem_statement: Optional[str] = Field(None, min_length=10, max_length=5000)
    solution: Optional[str] = Field(None, min_length=10, max_length=5000)
    domain: Optional[str] = Field(None, min_length=2, max_length=100)
    tech_stack: Optional[list[str]] = None
    team_members: Optional[list[TeamMember]] = None
    presentation_url: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    award: Optional[AwardType] = None


class ProjectResponse(BaseModel):
    id: str
    title: str
    problem_statement: str
    solution: str
    domain: str
    tech_stack: list[str]
    team_members: list[TeamMember]
    presentation_url: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    award: AwardType
    submitted_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class ProjectListResponse(BaseModel):
    projects: list[ProjectResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ProjectFilters(BaseModel):
    search: Optional[str] = None
    domain: Optional[list[str]] = None
    tech_stack: Optional[list[str]] = None
    award: Optional[list[AwardType]] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=12, ge=1, le=50)
