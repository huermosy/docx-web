import os
import yaml
from pathlib import Path
from typing import Any, Dict
from pydantic import BaseModel


class LLMConfig(BaseModel):
    api_base: str
    api_key: str
    model: str
    timeout_seconds: int
    chinese_check_by_llm: bool


class RulesConfig(BaseModel):
    body_font_size_min: float
    body_font_size_max: float
    heading_font_sizes: Dict[str, float]
    margin_top: float
    margin_bottom: float
    margin_left: float
    margin_right: float
    first_line_indent: int


class UploadConfig(BaseModel):
    max_file_size_mb: int
    allowed_extensions: list[str]


class TaskConfig(BaseModel):
    task_expiry_minutes: int
    cleanup_interval_minutes: int


class AppConfig(BaseModel):
    llm: LLMConfig
    rules: RulesConfig
    upload: UploadConfig
    task: TaskConfig


def load_config() -> AppConfig:
    config_path = Path(__file__).parent.parent.parent / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return AppConfig(**data)


config = load_config()
