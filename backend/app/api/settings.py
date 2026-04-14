from fastapi import APIRouter
from pydantic import BaseModel
from ..core.config import config

router = APIRouter(prefix="/api", tags=["config"])


class StandardCategory(BaseModel):
    title: str
    items: list[str]


class RulesSummary(BaseModel):
    body_font_size_min: float
    body_font_size_max: float
    heading_font_sizes: dict[str, float]
    margin_top: float
    margin_bottom: float
    margin_left: float
    margin_right: float
    first_line_indent: int


class ConfigResponse(BaseModel):
    llm_api_base: str
    llm_model: str
    timeout_seconds: int
    chinese_check_by_llm: bool
    max_file_size_mb: int
    allowed_extensions: list[str]
    rules: RulesSummary
    standards: dict[str, StandardCategory]


@router.get("/config")
async def get_config():
    """获取当前配置"""
    return ConfigResponse(
        llm_api_base=config.llm.api_base,
        llm_model=config.llm.model,
        timeout_seconds=config.llm.timeout_seconds,
        chinese_check_by_llm=config.llm.chinese_check_by_llm,
        max_file_size_mb=config.upload.max_file_size_mb,
        allowed_extensions=config.upload.allowed_extensions,
        rules=RulesSummary(
            body_font_size_min=config.rules.body_font_size_min,
            body_font_size_max=config.rules.body_font_size_max,
            heading_font_sizes=config.rules.heading_font_sizes,
            margin_top=config.rules.margin_top,
            margin_bottom=config.rules.margin_bottom,
            margin_left=config.rules.margin_left,
            margin_right=config.rules.margin_right,
            first_line_indent=config.rules.first_line_indent,
        ),
        standards={
            "layout": StandardCategory(
                title="页面布局",
                items=[
                    "纸张大小建议为 A4 或 Letter",
                    f"上边距 {config.rules.margin_top} cm，下边距 {config.rules.margin_bottom} cm",
                    f"左边距 {config.rules.margin_left} cm，右边距 {config.rules.margin_right} cm",
                ],
            ),
            "typography": StandardCategory(
                title="正文格式",
                items=[
                    f"正文字号范围 {config.rules.body_font_size_min}-{config.rules.body_font_size_max} pt",
                    f"首行缩进 {config.rules.first_line_indent} 字符",
                    "正文建议使用左对齐或两端对齐",
                ],
            ),
            "heading": StandardCategory(
                title="标题结构",
                items=[
                    f"一级标题建议字号 {config.rules.heading_font_sizes.get('h1', 22)} pt",
                    f"二级标题建议字号 {config.rules.heading_font_sizes.get('h2', 18)} pt",
                    f"三级标题建议字号 {config.rules.heading_font_sizes.get('h3', 16)} pt",
                    "标题级别应连续，序号建议使用标准编号格式",
                ],
            ),
            "figure": StandardCategory(
                title="图表与引用",
                items=[
                    "检查图表标题格式与编号",
                    "检查正文中的图表交叉引用是否完整",
                ],
            ),
            "spelling": StandardCategory(
                title="拼写与语言",
                items=[
                    "检查英文拼写问题",
                    "检查中文乱码与 LLM 辅助语言问题",
                ],
            ),
            "terminology": StandardCategory(
                title="术语一致性",
                items=[
                    "检查术语是否统一使用",
                    "支持上传术语对照表辅助检查",
                ],
            ),
            "consistency": StandardCategory(
                title="无模板一致性检查",
                items=[
                    "未上传模板时，以文档内同级标题的格式一致性为基准检查",
                ],
            ),
            "template": StandardCategory(
                title="参考模板检查",
                items=[
                    "上传模板后，将对照模板检查正文格式与页面设置",
                    "支持 .dotx、.dot、.docx、.doc 模板文件",
                ],
            ),
        },
    )


@router.put("/config")
async def update_config(data: dict):
    """更新配置"""
    return {"success": True, "message": "Config updated"}
