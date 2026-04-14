import httpx
import asyncio
from typing import Optional
from ..core.config import config


class LLMClient:
    """LLM 客户端（OpenAI 兼容 API）"""

    def __init__(self):
        self.cfg = config.llm
        self.timeout = self.cfg.timeout_seconds

    async def chat(self, messages: list[dict], language: str = 'zh') -> Optional[str]:
        """
        发送聊天请求到 LLM
        messages: [{"role": "user", "content": "..."}]
        language: 'zh' 或 'en'
        """
        headers = {
            "Authorization": f"Bearer {self.cfg.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.cfg.model,
            "messages": messages,
            "temperature": 0.1,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.cfg.api_base}/chat/completions",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        except httpx.TimeoutException:
            return None  # 超时
        except Exception as e:
            print(f"LLM request failed: {e}")
            return None

    async def analyze_document(self, text: str, issues: list, language: str = 'zh') -> Optional[list]:
        """
        分析文档，返回额外发现的问题
        """
        if language == 'zh':
            system_prompt = """你是一个专业的文档质量检查助手。
请检查以下文档内容，发现以下问题：
1. 拼写和语法错误
2. 术语使用不一致（注意中文术语的规范使用）
3. 段落逻辑问题
4. 格式问题的补充判断

已知问题：
{known_issues}

请以 JSON 格式返回发现的新问题：
{{"new_issues": [{{"description": "问题描述", "position": "位置", "severity": "critical/major/minor"}}]}}"""
        else:
            system_prompt = """You are a professional document quality checker.
Check the following document for:
1. Spelling and grammar errors
2. Inconsistent terminology usage
3. Paragraph logic issues
4. Additional format judgment

Known issues:
{known_issues}

Return new issues in JSON format:
{{"new_issues": [{{"description": "issue description", "position": "position", "severity": "critical/major/minor"}}]}}"""

        known_issues = "\n".join([f"- {i.description}" for i in issues[:10]])
        full_prompt = system_prompt.format(known_issues=known_issues)

        messages = [
            {"role": "system", "content": full_prompt},
            {"role": "user", "content": text[:8000]}  # 限制输入长度
        ]

        response = await self.chat(messages, language)
        return self._parse_llm_response(response)

    def _parse_llm_response(self, response: Optional[str]) -> Optional[list]:
        """解析 LLM 响应"""
        if not response:
            return None

        import json
        import re

        # 尝试提取 JSON
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
                return data.get('new_issues', [])
            except json.JSONDecodeError:
                pass

        return None
