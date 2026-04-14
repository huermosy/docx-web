import asyncio
from typing import Optional
from ..models.issue import Issue, IssuePosition, IssueCategory, Severity, IssueSource
from ..core.llm_client import LLMClient
from ..core.document_parser import DocumentParser


class LLMReviewer:
    """LLM 复核服务"""

    def __init__(self, parser: DocumentParser):
        self.parser = parser
        self.client = LLMClient()

    async def review(self, rule_issues: list[Issue]) -> tuple[list[Issue], bool]:
        """
        对文档进行 LLM 全量复核
        返回: (合并后的 issues, llm_available)
        """
        all_text = "\n".join(p.get('text', '') for p in self.parser.extract_paragraphs())
        language = self.parser.detect_language()

        try:
            new_issues = await asyncio.wait_for(
                self.client.analyze_document(all_text, rule_issues, language),
                timeout=30
            )

            if new_issues:
                llm_issues = self._convert_to_issues(new_issues)
                # 合并结果（去重由调用方处理）
                return rule_issues + llm_issues, True
            else:
                return rule_issues, True

        except asyncio.TimeoutError:
            # 超时，LLM 不可用
            return rule_issues, False
        except Exception as e:
            print(f"LLM review failed: {e}")
            return rule_issues, False

    def _convert_to_issues(self, new_issues: list) -> list[Issue]:
        """将 LLM 返回的问题转换为 Issue 对象"""
        result = []
        for idx, issue_data in enumerate(new_issues):
            severity_str = issue_data.get('severity', 'minor')
            try:
                severity = Severity(severity_str)
            except ValueError:
                severity = Severity.MINOR

            result.append(Issue(
                id=f"llm-{idx+1}",
                position=IssuePosition(
                    section=issue_data.get('position', ''),
                    paragraph=0,
                    line=0,
                    xpath=""
                ),
                category=IssueCategory.SPELLING,  # 默认分类
                severity=severity,
                description=issue_data.get('description', ''),
                fixSuggestion=issue_data.get('suggestion', '请检查并修正'),
                source=IssueSource.LLM,
                confidence=0.8,  # LLM 结果置信度 < 1.0
                ruleCode=None
            ))
        return result
