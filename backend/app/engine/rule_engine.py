from ..models.issue import Issue
from ..core.document_parser import DocumentParser
from .rules.layout_rules import LayoutRule
from .rules.typography_rules import TypographyRule
from .rules.heading_rules import HeadingRule
from .rules.figure_rules import FigureRule
from .rules.spelling_rules import SpellingRule
from .rules.terminology_rules import TerminologyRule
from .rules.consistency_rules import ConsistencyRule

class RuleEngine:
    """规则引擎主类"""

    def __init__(self, parser: DocumentParser, terminology_dict: dict = None, has_template: bool = False):
        self.parser = parser
        self.terminology_dict = terminology_dict
        self.has_template = has_template

    def run_all_rules(self) -> list[Issue]:
        """运行所有规则"""
        all_issues = []

        rules = [
            LayoutRule(self.parser),
            TypographyRule(self.parser),
            HeadingRule(self.parser),
            FigureRule(self.parser),
            SpellingRule(self.parser),
            TerminologyRule(self.parser, self.terminology_dict),
            ConsistencyRule(self.parser, self.has_template),
        ]

        for rule in rules:
            issues = rule.check()
            all_issues.extend(issues)

        # 去重
        all_issues = self._deduplicate(all_issues)

        return all_issues

    def _deduplicate(self, issues: list[Issue]) -> list[Issue]:
        """基于 (xpath, ruleCode) 去重，保留最高严重程度"""
        seen = {}
        severity_order = {'critical': 3, 'major': 2, 'minor': 1}

        for issue in issues:
            key = (issue.position.xpath, issue.ruleCode)
            if key in seen:
                # 保留更严重的
                if severity_order.get(issue.severity, 0) > severity_order.get(seen[key].severity, 0):
                    seen[key] = issue
            else:
                seen[key] = issue

        return list(seen.values())
