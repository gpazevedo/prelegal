def test_catalog_returns_all_items(client):
    res = client.get("/api/catalog")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 12
    names = [i["name"] for i in items]
    assert "Mutual NDA — Standard Terms" in names


def test_catalog_item_has_required_fields(client):
    res = client.get("/api/catalog")
    for item in res.json():
        assert "name" in item
        assert "description" in item
        assert "filename" in item


def test_template_returns_content(client):
    res = client.get("/api/templates/Mutual-NDA.md")
    assert res.status_code == 200
    data = res.json()
    assert "content" in data
    assert len(data["content"]) > 100


def test_template_not_found(client):
    res = client.get("/api/templates/nonexistent.md")
    assert res.status_code == 404


def test_template_path_traversal_blocked(client):
    res = client.get("/api/templates/../catalog.json")
    assert res.status_code in (400, 404)
