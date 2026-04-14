from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class IssueSource(str, Enum):
    RULE = "rule"
    LLM = "llm"
    MERGED = "merged"


class IssueCategory(str, Enum):
    LAYOUT = "layout"           # 页面布局
    TYPOGRAPHY = "typography"   # 字体段落
    HEADING = "heading"        # 标题结构
    FIGURE = "figure"          # 图表与引用
    SPELLING = "spelling"      # 拼写与语法
    TERMINOLOGY = "terminology" # 术语统一性
    CONSISTENCY = "consistency" # 标题一致性


class Severity(str, Enum):
    CRITICAL = "critical"  # 严重（红色）
    MAJOR = "major"        # 中等（黄色）
    MINOR = "minor"        # 轻微（蓝色）


class IssuePosition(BaseModel):
    section: str = ""          # 章节
    paragraph: int = 0         # 段落序号
    line: int = 0             # 行号（可选）
    xpath: str = ""            # docx元素路径


class Issue(BaseModel):
    id: str
    position: IssuePosition
    category: IssueCategory
    severity: Severity
    description: str
    fixSuggestion: str
    source: IssueSource
    confidence: float = Field(ge=0.0, le=1.0)  # 规则引擎=1.0, LLM<1.0
    templateRelated: bool = False
    ruleCode: Optional[str] = None  # 规则引擎规则代码，LLM问题为None
