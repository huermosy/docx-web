from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class TaskStatus(str, Enum):
    PENDING = "pending"
    PARSING = "parsing"
    RULE_COMPLETE = "rule_complete"
    LLM_RUNNING = "llm_running"
    DONE = "done"
    FAILED = "failed"


class Task(BaseModel):
    task_id: str
    status: TaskStatus
    progress: int = Field(ge=0, le=100, default=0)
    message: str = ""
    created_at: datetime
    updated_at: datetime
    rule_result: Optional[List[dict]] = None
    llm_result: Optional[List[dict]] = None
    merged_result: Optional[List[dict]] = None
    llm_available: bool = True
    error_code: Optional[str] = None
