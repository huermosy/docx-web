from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
import asyncio
from datetime import datetime
from pathlib import Path

from ..models.issue import Issue, IssueCategory, Severity, IssueSource
from ..models.task import Task, TaskStatus
from ..core.document_parser import DocumentParser
from ..engine.rule_engine import RuleEngine
from ..engine.llm_reviewer import LLMReviewer

router = APIRouter(prefix="/api", tags=["analyze"])

# 任务存储（内存字典，生产环境应使用 Redis/SQLite）
TASK_STORE: dict[str, Task] = {}
TEMP_DIR = Path(__file__).parent.parent.parent / "temp"


class AnalyzeRequest(BaseModel):
    file_id: str
    terminology_dict: Optional[dict] = None
    has_template: bool = False


class AnalyzeResponse(BaseModel):
    task_id: str


class StatusResponse(BaseModel):
    task_id: str
    status: str
    progress: int
    message: str
    created_at: str
    updated_at: str


class ResultResponse(BaseModel):
    task_id: str
    status: str
    issues: list
    llm_available: bool


@router.post("/analyze")
async def create_analysis(request: AnalyzeRequest):
    """创建分析任务"""
    file_path = TEMP_DIR / f"{request.file_id}.docx"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    task_id = str(uuid.uuid4())
    task = Task(
        task_id=task_id,
        status=TaskStatus.PARSING,
        progress=0,
        message="正在初始化...",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    TASK_STORE[task_id] = task

    # 启动后台任务
    asyncio.create_task(run_analysis(task_id, str(file_path), request.terminology_dict, request.has_template))

    return AnalyzeResponse(task_id=task_id)


@router.get("/analyze/{task_id}/status")
async def get_status(task_id: str):
    """获取任务状态"""
    task = TASK_STORE.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return StatusResponse(
        task_id=task.task_id,
        status=task.status.value,
        progress=task.progress,
        message=task.message,
        created_at=task.created_at.isoformat(),
        updated_at=task.updated_at.isoformat(),
    )


@router.get("/analyze/{task_id}/result")
async def get_result(task_id: str):
    """获取分析结果"""
    task = TASK_STORE.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status not in [TaskStatus.RULE_COMPLETE, TaskStatus.DONE]:
        raise HTTPException(status_code=400, detail="Result not available yet")

    return ResultResponse(
        task_id=task.task_id,
        status=task.status.value,
        issues=[i.model_dump() for i in (task.merged_result or task.rule_result or [])],
        llm_available=task.llm_available,
    )


async def run_analysis(task_id: str, file_path: str, terminology_dict: dict = None, has_template: bool = False):
    """执行分析的后台任务"""
    task = TASK_STORE.get(task_id)
    if not task:
        return

    try:
        # 1. 解析文档
        task.status = TaskStatus.PARSING
        task.progress = 10
        task.message = "正在解析文档..."
        task.updated_at = datetime.now()

        parser = DocumentParser(file_path)

        # 2. 规则引擎检查
        task.status = TaskStatus.RULE_COMPLETE
        task.progress = 50
        task.message = "规则检查完成，LLM 复核中..."
        task.updated_at = datetime.now()

        engine = RuleEngine(parser, terminology_dict, has_template)
        rule_issues = engine.run_all_rules()
        task.rule_result = rule_issues

        # 3. LLM 复核
        task.status = TaskStatus.LLM_RUNNING
        task.progress = 70
        task.message = "LLM 复核进行中..."
        task.updated_at = datetime.now()

        reviewer = LLMReviewer(parser)
        merged_issues, llm_available = await reviewer.review(rule_issues)
        task.merged_result = merged_issues
        task.llm_available = llm_available

        # 4. 完成
        task.status = TaskStatus.DONE
        task.progress = 100
        task.message = "分析完成" if llm_available else "分析完成（LLM 不可用）"
        task.updated_at = datetime.now()

    except Exception as e:
        task.status = TaskStatus.FAILED
        task.message = f"分析失败: {str(e)}"
        task.error_code = "ANALYSIS_ERROR"
        task.updated_at = datetime.now()
        print(f"Analysis failed for {task_id}: {e}")
