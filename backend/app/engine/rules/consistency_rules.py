from ...models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ...core.document_parser import DocumentParser

class ConsistencyRule:
    """格式一致性规则检查（无模板时使用）"""

    def __init__(self, parser: DocumentParser, has_template: bool = False):
        self.parser = parser
        self.has_template = has_template
        self.issues = []

    def check(self) -> list[Issue]:
        self.issues = []

        if self.has_template:
            return self.issues  # 有模板时跳过，由 TemplateRule 处理

        paragraphs = self.parser.extract_paragraphs()
        headings = self.parser.extract_headings()

        if len(headings) < 2:
            return self.issues  # 少于2个标题，无需一致性检查

        # 以第一个标题的格式为基准
        base_heading_idx = headings[0][2] if len(headings) > 0 else 0
        base_para = paragraphs[base_heading_idx] if base_heading_idx < len(paragraphs) else {}
        base_font_size = base_para.get('font_size', 0)
        base_font_name = base_para.get('font_name', '')

        # 检查后续标题格式一致性
        for idx, (level, text, para_idx) in enumerate(headings[1:], 1):
            if para_idx >= len(paragraphs):
                continue

            para = paragraphs[para_idx]
            font_size = para.get('font_size', 0)
            font_name = para.get('font_name', '')

            # 同一级别的标题应该格式一致
            if level == headings[0][0]:  # 与一级标题对比
                if base_font_size > 0 and font_size > 0 and abs(font_size - base_font_size) > 0.5:
                    self.issues.append(Issue(
                        id=f"consist-{idx}",
                        position=IssuePosition(section=text, paragraph=para_idx, line=0, xpath=""),
                        category=IssueCategory.CONSISTENCY,
                        severity=Severity.MINOR,
                        description=f"同级别标题字号不一致：基准 {base_font_size}pt，当前 {font_size}pt",
                        fixSuggestion=f"建议将标题字号统一为 {base_font_size}pt",
                        source=IssueSource.RULE,
                        confidence=0.85,
                        ruleCode="CONSISTENCY_HEADING_SIZE"
                    ))

        return self.issues
