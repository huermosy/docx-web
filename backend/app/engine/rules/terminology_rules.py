from ...models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ...core.document_parser import DocumentParser
import re

class TerminologyRule:
    """术语统一性规则检查"""

    def __init__(self, parser: DocumentParser, terminology_dict: dict = None):
        self.parser = parser
        self.terminology_dict = terminology_dict or {}
        self.issues = []

    def check(self) -> list[Issue]:
        self.issues = []

        if not self.terminology_dict:
            return self.issues  # 无术语表，跳过

        paragraphs = self.parser.extract_paragraphs()
        all_text = ' '.join(p.get('text', '') for p in paragraphs)

        # 检查术语变体
        for canonical, variants in self.terminology_dict.items():
            if not isinstance(variants, list):
                variants = [variants]

            for variant in variants:
                if variant in all_text and canonical != variant:
                    # 找到非标准术语
                    positions = [m.start() for m in re.finditer(re.escape(variant), all_text)]
                    for pos in positions[:3]:  # 最多报告3处
                        self.issues.append(Issue(
                            id=f"term-{variant[:10]}",
                            position=IssuePosition(section="术语检查", paragraph=0, line=0, xpath=""),
                            category=IssueCategory.TERMINOLOGY,
                            severity=Severity.MINOR,
                            description=f"使用了非标准术语 '{variant}'，建议统一为 '{canonical}'",
                            fixSuggestion=f"将 '{variant}' 替换为 '{canonical}'",
                            source=IssueSource.RULE,
                            confidence=0.9,
                            ruleCode="TERMINOLOGY_VARIANT"
                        ))

        return self.issues
