from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/api", tags=["upload"])

TEMP_DIR = Path(__file__).parent.parent.parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)


class UploadResponse(BaseModel):
    success: bool
    file_id: str
    filename: str


class TerminologyResponse(BaseModel):
    success: bool
    term_count: int


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """上传 Word 文档"""
    # 验证文件类型
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are supported")

    # 验证文件大小（20MB）
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 20MB limit")

    # 保存文件
    file_id = str(uuid.uuid4())
    file_path = TEMP_DIR / f"{file_id}.docx"
    with open(file_path, "wb") as f:
        f.write(content)

    return UploadResponse(success=True, file_id=file_id, filename=file.filename)


@router.post("/upload/terminology")
async def upload_terminology(file: UploadFile = File(...)):
    """上传术语对照表"""
    content = await file.read()
    try:
        import json
        terms = json.loads(content)
        return TerminologyResponse(success=True, term_count=len(terms))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
