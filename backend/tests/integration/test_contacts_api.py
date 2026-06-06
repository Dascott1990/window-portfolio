def test_create_contact(client):
    r = client.post("/api/v1/contacts", json={"name": "Jane Doe", "phone": "555-1234"})
    assert r.status_code == 201
    assert r.get_json()["data"]["name"] == "Jane Doe"


def test_create_contact_no_name(client):
    r = client.post("/api/v1/contacts", json={"phone": "555-9999"})
    assert r.status_code == 400


def test_list_contacts(client):
    assert client.get("/api/v1/contacts").status_code == 200
