from ...models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ...core.document_parser import DocumentParser
from ...core.config import config
import re

class SpellingRule:
    """拼写规则检查"""

    def __init__(self, parser: DocumentParser):
        self.parser = parser
        self.cfg = config
        self.issues = []

    def check(self) -> list[Issue]:
        self.issues = []
        language = self.parser.detect_language()
        paragraphs = self.parser.extract_paragraphs()

        if language == 'en':
            self._check_english_spelling(paragraphs)
        elif language == 'zh':
            self._check_chinese_garbled(paragraphs)

        return self.issues

    def _check_english_spelling(self, paragraphs: list):
        """检查英文拼写"""
        try:
            from spellchecker import SpellChecker
            spell = SpellChecker()

            all_text = ' '.join(p.get('text', '') for p in paragraphs)
            # 提取英文单词
            words = re.findall(r'[a-zA-Z]+', all_text)
            misspelled = spell.unknown(words)

            for word in misspelled:
                self.issues.append(Issue(
                    id=f"spell-en-{word}",
                    position=IssuePosition(section="拼写检查", paragraph=0, line=0, xpath=""),
                    category=IssueCategory.SPELLING,
                    severity=Severity.MAJOR,
                    description=f"可能存在拼写错误: '{word}'",
                    fixSuggestion=f"请检查 '{word}' 的拼写是否正确",
                    source=IssueSource.RULE,
                    confidence=0.85,
                    ruleCode="SPELLING_EN"
                ))
        except ImportError:
            pass  # pyspellchecker 未安装

    def _check_chinese_garbled(self, paragraphs: list):
        """检查中文乱码字符（Unicode 私用区）"""
        garbled_pattern = re.compile(r'[\uE000-\uF8FF]')

        for idx, para in enumerate(paragraphs):
            text = para.get('text', '')
            matches = garbled_pattern.findall(text)
            if matches:
                self.issues.append(Issue(
                    id=f"spell-zh-{idx}",
                    position=IssuePosition(section=para.get('section', ''), paragraph=idx, line=0, xpath=""),
                    category=IssueCategory.SPELLING,
                    severity=Severity.MAJOR,
                    description=f"段落中发现 {len(matches)} 个乱码字符",
                    fixSuggestion="请检查并修正这些乱码字符",
                    source=IssueSource.RULE,
                    confidence=1.0,
                    ruleCode="SPELLING_ZH_GARBLED"
                ))
