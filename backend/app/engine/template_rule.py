from ..models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ..core.document_parser import DocumentParser


class TemplateRule:
    """
    模板合规检查规则
    当有模板时，使用此规则替代 ConsistencyRule
    """

    def __init__(self, parser: DocumentParser, template_parser: DocumentParser):
        self.parser = parser
        self.template_parser = template_parser
        self.issues = []

    def check(self) -> list[Issue]:
        """对照模板检查文档合规性"""
        self.issues = []

        # 提取模板规范
        template_settings = self._extract_template_settings()

        # 检查正文格式
        paragraphs = self.parser.extract_paragraphs()
        for idx, para in enumerate(paragraphs):
            self._check_against_template(para, idx, template_settings)

        return self.issues

    def _extract_template_settings(self) -> dict:
        """从模板中提取规范设置"""
        settings = {
            'body_font': '',
            'body_font_size': 0,
            'body_alignment': 'left',
            'line_spacing': 1.5,
            'first_line_indent': 20,
        }

        template_paragraphs = self.template_parser.extract_paragraphs()
        for para in template_paragraphs:
            if not para.get('is_heading', False):
                settings['body_font'] = para.get('font_name', '')
                settings['body_font_size'] = para.get('font_size', 12)
                settings['body_alignment'] = para.get('alignment', 'left')
                break

        # 模板页面设置
        page_setup = self.template_parser.get_page_setup()
        settings.update(page_setup)

        return settings

    def _check_against_template(self, para: dict, idx: int, template_settings: dict):
        """将段落与模板对比"""
        if para.get('is_heading', False):
            return  # 标题单独检查

        # 检查字体
        if template_settings.get('body_font'):
            template_font = template_settings['body_font']
            para_font = para.get('font_name', '')
            if para_font and para_font != template_font:
                self.issues.append(Issue(
                    id=f"tmpl-font-{idx}",
                    position=IssuePosition(
                        section=para.get('section', ''),
                        paragraph=idx,
                        line=0,
                        xpath=""
                    ),
                    category=IssueCategory.TYPOGRAPHY,
                    severity=Severity.MAJOR,
                    description=f"正文字体 '{para_font}' 与模板规范 '{template_font}' 不一致",
                    fixSuggestion=f"建议使用模板指定的字体 '{template_font}'",
                    source=IssueSource.RULE,
                    confidence=1.0,
                    ruleCode="TEMPLATE_FONT",
                    templateRelated=True
                ))

        # 检查字号
        template_size = template_settings.get('body_font_size', 0)
        para_size = para.get('font_size', 0)
        if template_size > 0 and para_size > 0 and abs(para_size - template_size) > 0.5:
            self.issues.append(Issue(
                id=f"tmpl-size-{idx}",
                position=IssuePosition(
                    section=para.get('section', ''),
                    paragraph=idx,
                    line=0,
                    xpath=""
                ),
                category=IssueCategory.TYPOGRAPHY,
                severity=Severity.MAJOR,
                description=f"正文字号 {para_size}pt 与模板规范 {template_size}pt 不一致",
                fixSuggestion=f"建议将字号调整为 {template_size}pt",
                source=IssueSource.RULE,
                confidence=1.0,
                ruleCode="TEMPLATE_FONT_SIZE",
                templateRelated=True
            ))
