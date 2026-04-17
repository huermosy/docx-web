# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览
这是一个面向 Word 文档的质量检查工具，核心流程是：上传文档 → 创建分析任务 → 规则引擎检查 → LLM 复核 → 轮询结果 → 下载报告。

前端负责文档上传、模板上传、检查结果展示和报告下载；后端负责 docx 解析、规则检查、LLM 复核、配置读取和报告生成。

## 常用命令

### 后端
安装依赖并启动开发服务：
```bash
cd backend
pip install -r requirements.txt
python run.py
```

如果需要直接用 Uvicorn 启动 FastAPI 应用：
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

运行全部后端测试：
```bash
cd backend
pytest tests
```

运行单个测试：
```bash
cd backend
pytest tests/test_api.py::test_health_endpoint -q
```

说明：仓库内 `backend/requirements.txt` 未显式包含 `pytest` 和 `httpx`，测试前先确认环境中已安装这两个包。仓库当前未发现 `backend/tests/`，如果要补测试，默认按上述 `pytest tests/...` 约定组织。

### 前端
安装依赖并启动开发服务：
```bash
cd frontend
npm install
npm run dev
```

构建生产包：
```bash
cd frontend
npm run build
```

本地预览构建产物：
```bash
cd frontend
npm run preview
```

说明：前端 `package.json` 目前只有 `dev`、`build`、`preview`，没有单独的 `lint` 或 `test` 脚本。

## 高层架构

### 端到端主流程
1. 前端在 `frontend/src/components/Upload/UploadZone.tsx` 收集文档和可选模板。
2. `frontend/src/hooks/useQCAnalysis.ts` 先调用 `/api/upload` 上传 `.docx`，再调用 `/api/analyze` 创建任务，并持续轮询 `/api/analyze/{taskId}/status`。
3. 后端在 `backend/app/api/analyze.py` 中把任务写入进程内 `TASK_STORE`，随后通过 `asyncio.create_task()` 异步执行分析。
4. `backend/app/core/document_parser.py` 解析文档结构；`backend/app/engine/rule_engine.py` 顺序运行 7 类规则并按 `(xpath, ruleCode)` 去重。
5. `backend/app/engine/llm_reviewer.py` 将规则结果与全文文本交给 LLM 做补充复核；失败或超时时会回退为仅规则结果，并把 `llm_available` 置为 `false`。
6. 任务完成后，前端读取 `/api/analyze/{taskId}/result` 展示问题列表，并通过 `/api/report/{taskId}/{format}` 下载 PDF 或 DOCX 报告。

### 前端
- `frontend/src/App.tsx` 是页面编排入口：加载配置、展示检查标准、处理模板上传状态，并在分析完成后渲染问题面板和下载面板。
- `frontend/src/hooks/useQCAnalysis.ts` 封装主状态机，核心状态包括 `idle`、`uploading`、`analyzing`、`done`、`error`。它会在 `rule_complete` 阶段提前拉取一次规则结果，在 `done` 阶段再拉取最终合并结果。
- `frontend/src/api/qcApi.ts` 统一封装所有 `/api` 请求，并定义前后端共用的数据形状。
- `frontend/vite.config.ts` 将本地开发服务器固定在 `3000` 端口，并把 `/api` 代理到 `http://localhost:8000`。

### 后端
- `backend/app/main.py` 创建 FastAPI 应用，注册 upload、settings、analyze、report 四组路由，并开放 `/health` 健康检查。
- `backend/app/api/upload.py` 只接受 `.docx` 文档上传，大小限制为 20MB；术语表上传接口当前只做 JSON 解析并返回术语数量，没有持久化。
- `backend/app/api/analyze.py` 负责任务创建、状态查询和结果查询。任务状态流转是 `parsing` → `rule_complete` → `llm_running` → `done`，异常时进入 `failed`。
- `backend/app/engine/rule_engine.py` 聚合页面布局、正文格式、标题结构、图表引用、拼写语法、术语统一、标题一致性 7 类规则；模板相关判断通过 `has_template` 参与一致性检查。
- `backend/app/engine/llm_reviewer.py` 使用 `backend/app/core/llm_client.py` 调用 LLM，默认 30 秒超时；新增的 LLM 问题当前会被映射为默认分类并与规则结果直接拼接返回。
- `backend/app/api/report.py` 既处理模板上传，也在下载请求到来时即时生成 PDF / DOCX 报告，而不是提前离线产出。
- `backend/app/api/settings.py` 从 `backend/app/core/config.py` 读取全局配置对象并整理成前端展示需要的“检查标准”；`PUT /api/config` 目前只返回成功，不会写回 `backend/config.yaml`。

### 配置与运行时数据
- `backend/config.yaml` 是运行配置真实来源，包含 LLM 参数、规则阈值、上传限制和任务相关配置。
- `backend/temp/` 保存上传的原始文档。
- `backend/templates/` 保存预设模板和用户上传模板。
- `backend/reports/` 保存按任务 ID 生成的报告文件。

## 需要记住的项目约束
- `TASK_STORE` 是进程内内存字典，不会跨进程或重启保留；任何任务持久化、横向扩展或重启恢复都不能依赖当前实现。
- 前端展示的文件限制来自 `/api/config`，但 `backend/app/api/upload.py` 实际只允许上传 `.docx` 文档；如果修改上传能力，需要同时更新接口校验和配置展示。
- 模板文件支持 `.dotx`、`.dot`、`.docx`、`.doc`，模板上传与文档上传走的是不同接口。
- 报告是在下载时按当前任务结果即时生成的，不是分析完成时预先生成的。
- `backend/run.py` 通过 `backend.app.main:app` 启动，适合从仓库根目录执行；如果已经 `cd backend`，优先使用 `python run.py` 或 `uvicorn app.main:app --reload`，不要把 `backend.` 前缀照搬到 `uvicorn` 命令里。
- 如果后续要真正持久化配置，不能只改接口返回值，还要补上写回 `backend/config.yaml` 的路径与校验逻辑。
