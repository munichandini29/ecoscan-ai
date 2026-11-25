import io
from PIL import Image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_clean_environment_scan():
    # Create a clean green park-like test image
    img = Image.new("RGB", (200, 200), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    res = client.post(
        "/api/analyze",
        files={"file": ("clean_park.jpg", buf, "image/jpeg")},
        data={"category": "Auto-Detect", "location": "Central Park Zone"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "Clean / No Threat"
    assert data["status"] == "Verified Clean"

def test_reports_listing():
    res = client.get("/api/reports")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 1