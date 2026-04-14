# Word 文档质量检查工具

面向企业办公人员的网页端 Word 文档质量检查工具。

## 功能
- 文档上传（按钮+拖拽）
- 7大类格式检查（页面布局、字体段落、标题结构、图表引用、拼写语法、术语统一、标题一致性）
- 规则引擎 + LLM 双层检查
- 诊断面板可视化
- PDF/Word 双格式报告下载

## 快速开始

### 后端
```bash
cd backend
pip install -r requirements.txt
# 编辑 config.yaml 配置 LLM API
python run.py
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

## 项目结构
- frontend/ - React 前端
- backend/ - Python FastAPI 后端
- templates/ - 预设模板
