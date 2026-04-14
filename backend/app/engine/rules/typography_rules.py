from ...models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ...core.document_parser import DocumentParser
from ...core.config import config

class TypographyRule:
    """字体段落规则检查"""

    def __init__(self, parser: DocumentParser):
        self.parser = parser
        self.cfg = config.rules
        self.issues = []

    def check(self) -> list[Issue]:
        self.issues = []
        paragraphs = self.parser.extract_paragraphs()

        for idx, para in enumerate(paragraphs):
            self._check_font_size(para, idx)
            self._check_alignment(para, idx)
            self._check_first_line_indent(para, idx)

        return self.issues

    def _check_font_size(self, para: dict, idx: int):
        """检查字号"""
        font_size = para.get('font_size', 0)
        if font_size == 0:
            return

        min_size = self.cfg.body_font_size_min
        max_size = self.cfg.body_font_size_max

        if para.get('is_heading', False):
            return  # 标题字号单独检查

        if font_size < min_size or font_size > max_size:
            self.issues.append(Issue(
                id=f"typo-size-{idx}",
                position=IssuePosition(section=para.get('section', ''), paragraph=idx, line=0, xpath=""),
                category=IssueCategory.TYPOGRAPHY,
                severity=Severity.MAJOR if font_size < min_size else Severity.MINOR,
                description=f"正文字号 {font_size}pt 不符合标准范围 {min_size}-{max_size}pt",
                fixSuggestion=f"建议将字号调整为 {min_size}-{max_size}pt 之间的值",
                source=IssueSource.RULE,
                confidence=1.0,
                ruleCode="TYPO_FONT_SIZE"
            ))

    def _check_alignment(self, para: dict, idx: int):
        """检查对齐方式"""
        alignment = para.get('alignment', 'left')
        if alignment not in ['left', 'center', 'right', 'justify']:
            self.issues.append(Issue(
                id=f"typo-align-{idx}",
                position=IssuePosition(section=para.get('section', ''), paragraph=idx, line=0, xpath=""),
                category=IssueCategory.TYPOGRAPHY,
                severity=Severity.MINOR,
                description=f"段落对齐方式 '{alignment}' 可能不符合规范",
                fixSuggestion="建议正文使用左对齐或两端对齐",
                source=IssueSource.RULE,
                confidence=0.8,
                ruleCode="TYPO_ALIGNMENT"
            ))

    def _check_first_line_indent(self, para: dict, idx: int):
        """检查首行缩进"""
        if para.get('is_heading', False):
            return

        indent = para.get('first_line_indent', 0)
        expected = self.cfg.first_line_indent * 10  # 字符转 pt

        if indent > 0 and abs(indent - expected) > 5:
            self.issues.append(Issue(
                id=f"typo-indent-{idx}",
                position=IssuePosition(section=para.get('section', ''), paragraph=idx, line=0, xpath=""),
                category=IssueCategory.TYPOGRAPHY,
                severity=Severity.MINOR,
                description=f"首行缩进 {indent}pt 与标准值 {expected}pt 不符",
                fixSuggestion=f"建议将首行缩进设置为 {expected}pt（约 {self.cfg.first_line_indent} 字符）",
                source=IssueSource.RULE,
                confidence=1.0,
                ruleCode="TYPO_INDENT"
            ))
