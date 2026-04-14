import pytest
from httpx import AsyncClient
from backend.app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """测试健康检查端点"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_endpoint():
    """测试根端点"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_upload_invalid_file_type():
    """测试上传无效文件类型"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        files = {"file": ("test.txt", b"test content", "text/plain")}
        response = await client.post("/api/upload", files=files)
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_config():
    """测试获取配置"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        assert "llm_api_base" in data
        assert "max_file_size_mb" in data
