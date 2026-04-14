from ...models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ...core.document_parser import DocumentParser
import re

class FigureRule:
    """图表与引用规则检查"""

    # 图序 pattern: 图1, 图1.1, Figure 1
    FIGURE_PATTERN = re.compile(r'(?:^|[^\w])(图\s*\d+(?:\.\d+)?|Figure\s*\d+)', re.I)
    # 表序 pattern: 表1, 表1.1, Table 1
    TABLE_PATTERN = re.compile(r'(?:^|[^\w])(表\s*\d+(?:\.\d+)?|Table\s*\d+)', re.I)
    # 引用 pattern: 见图1, 见表2
    REF_PATTERN = re.compile(r'[见参]?[阅看]?(图|表)\s*(\d+(?:\.\d+)?)', re.I)

    def __init__(self, parser: DocumentParser):
        self.parser = parser
        self.issues = []

    def check(self) -> list[Issue]:
        self.issues = []
        full_text = "\n".join(p.get('text', '') for p in self.parser.extract_paragraphs())
        paragraphs = self.parser.extract_paragraphs()

        figures = self.FIGURE_PATTERN.findall(full_text)
        tables = self.TABLE_PATTERN.findall(full_text)
        refs = self.REF_PATTERN.findall(full_text)

        # 检查图表数量与标题一致性
        if len(refs) > 0:
            # 提取引用的编号
            ref_nums = set()
            for cat, num in refs:
                ref_nums.add(num.strip())

            # 检查引用是否都有对应的图表/表格
            all_items = set()
            for f in figures:
                m = re.search(r'\d+(?:\.\d+)?', str(f))
                if m:
                    all_items.add(m.group())
            for t in tables:
                m = re.search(r'\d+(?:\.\d+)?', str(t))
                if m:
                    all_items.add(m.group())

            missing = ref_nums - all_items
            if missing:
                self.issues.append(Issue(
                    id=f"figure-ref-{len(self.issues)+1}",
                    position=IssuePosition(section="图表引用", paragraph=0, line=0, xpath=""),
                    category=IssueCategory.FIGURE,
                    severity=Severity.MAJOR,
                    description=f"文档中引用了图表编号 {missing}，但未找到对应的图表或表格",
                    fixSuggestion="请检查引用的图表编号是否正确，或添加对应的图表",
                    source=IssueSource.RULE,
                    confidence=0.9,
                    ruleCode="FIGURE_REF_MISSING"
                ))

        return self.issues
