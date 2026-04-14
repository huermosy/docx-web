from ...models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ...core.document_parser import DocumentParser
import re

class HeadingRule:
    """标题结构规则检查"""

    def __init__(self, parser: DocumentParser):
        self.parser = parser
        self.issues = []

    def check(self) -> list[Issue]:
        self.issues = []
        headings = self.parser.extract_headings()

        prev_level = 0
        for idx, (level, text, para_idx) in enumerate(headings):
            # 检查级别连续性
            if level > prev_level + 1 and prev_level > 0:
                self.issues.append(Issue(
                    id=f"heading-seq-{idx}",
                    position=IssuePosition(section=text, paragraph=para_idx, line=0, xpath=""),
                    category=IssueCategory.HEADING,
                    severity=Severity.MAJOR,
                    description=f"标题级别跳跃：从第 {prev_level} 级跳到第 {level} 级",
                    fixSuggestion="请确保标题级别连续，不要跳过中间级别",
                    source=IssueSource.RULE,
                    confidence=1.0,
                    ruleCode="HEADING_SEQUENCE"
                ))

            # 检查序号排列
            if text and not self._has_valid_numbering(text, level):
                self.issues.append(Issue(
                    id=f"heading-num-{idx}",
                    position=IssuePosition(section=text, paragraph=para_idx, line=0, xpath=""),
                    category=IssueCategory.HEADING,
                    severity=Severity.MINOR,
                    description=f"标题序号可能不规范: {text[:30]}...",
                    fixSuggestion="建议使用标准序号格式，如 '1. ', '1.1 ', '一、' 等",
                    source=IssueSource.RULE,
                    confidence=0.7,
                    ruleCode="HEADING_NUMBERING"
                ))

            prev_level = level

        return self.issues

    def _has_valid_numbering(self, text: str, level: int) -> bool:
        """检查是否有有效的序号"""
        patterns = [
            r'^\d+\.',      # 1. 2. 3.
            r'^\d+\.\d+',   # 1.1 2.1
            r'^[一二三四五六七八九十]+、',  # 一、二、三、
            r'^[甲乙丙丁戊己庚辛壬癸]+、',  # 甲、乙、丙、
        ]
        for pattern in patterns:
            if re.match(pattern, text.strip()):
                return True
        return False
