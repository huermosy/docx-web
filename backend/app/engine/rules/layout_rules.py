from ...models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ...core.document_parser import DocumentParser
from ...core.config import config
import re

class LayoutRule:
    """页面布局规则检查"""

    def __init__(self, parser: DocumentParser):
        self.parser = parser
        self.cfg = config.rules
        self.issues = []

    def check(self) -> list[Issue]:
        self.issues = []
        self._check_page_size()
        self._check_margins()
        return self.issues

    def _check_page_size(self):
        """检查纸张大小"""
        page_setup = self.parser.get_page_setup()
        page_width = page_setup.get('page_width', 0)  # in cm
        page_height = page_setup.get('page_height', 0)

        # A4: 21cm x 29.7cm, Letter: 21.59cm x 27.94cm
        A4_WIDTH, A4_HEIGHT = 21.0, 29.7

        if abs(page_width - A4_WIDTH) > 0.5 and abs(page_width - 21.59) > 0.5:
            self.issues.append(Issue(
                id=f"layout-page-{len(self.issues)+1}",
                position=IssuePosition(section="页面设置", paragraph=0, line=0, xpath=""),
                category=IssueCategory.LAYOUT,
                severity=Severity.MAJOR,
                description=f"纸张宽度 {page_width}cm 不符合标准 A4 (21cm) 或 Letter (21.59cm)",
                fixSuggestion="请将纸张大小设置为 A4 或 Letter",
                source=IssueSource.RULE,
                confidence=1.0,
                ruleCode="LAYOUT_PAGE_SIZE"
            ))

    def _check_margins(self):
        """检查页边距"""
        page_setup = self.parser.get_page_setup()
        margin_top = page_setup.get('margin_top', 0)
        margin_bottom = page_setup.get('margin_bottom', 0)
        margin_left = page_setup.get('margin_left', 0)
        margin_right = page_setup.get('margin_right', 0)

        expected_margin = 2.54  # 2.54cm = 1 inch
        tolerance = 0.5

        if abs(margin_top - expected_margin) > tolerance:
            self.issues.append(Issue(
                id=f"layout-margin-{len(self.issues)+1}",
                position=IssuePosition(section="页面设置", paragraph=0, line=0, xpath=""),
                category=IssueCategory.LAYOUT,
                severity=Severity.MINOR,
                description=f"上边距 {margin_top}cm 与标准值 {expected_margin}cm 差异较大",
                fixSuggestion=f"建议将上边距设置为 {expected_margin}cm",
                source=IssueSource.RULE,
                confidence=1.0,
                ruleCode="LAYOUT_MARGIN_TOP"
            ))
