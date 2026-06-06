def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_404(client):
    r = client.get("/api/v1/nonexistent")
    assert r.status_code == 404
    assert r.get_json()["success"] is False
