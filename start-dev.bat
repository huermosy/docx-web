@echo off
setlocal

REM 一键启动后端和前端开发服务（会打开两个独立终端窗口）
start "QC Backend" cmd /k "cd /d %~dp0backend && python run.py"
start "QC Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
