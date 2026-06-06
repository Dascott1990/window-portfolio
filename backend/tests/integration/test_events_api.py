def test_list_events_empty(client):
    r = client.get("/api/v1/events")
    assert r.status_code == 200
    assert isinstance(r.get_json()["data"], list)


def test_create_event_validation(client):
    r = client.post("/api/v1/events", json={"title": "No date"})
    assert r.status_code == 400


def test_create_event_success(client):
    r = client.post("/api/v1/events", json={
        "title": "Test Event", "event_date": "2026-12-25", "event_time": "10:00",
    })
    assert r.status_code == 201
    assert r.get_json()["data"]["title"] == "Test Event"
