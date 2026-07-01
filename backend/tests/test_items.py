from httpx import AsyncClient


async def test_create_and_list_items(client: AsyncClient) -> None:
    create_resp = await client.post("/api/items", json={"name": "Widget", "description": "A thing"})
    assert create_resp.status_code == 201
    item = create_resp.json()
    assert item["name"] == "Widget"
    assert item["description"] == "A thing"

    list_resp = await client.get("/api/items")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


async def test_get_missing_item_returns_404(client: AsyncClient) -> None:
    resp = await client.get("/api/items/999")
    assert resp.status_code == 404


async def test_delete_item(client: AsyncClient) -> None:
    create_resp = await client.post("/api/items", json={"name": "Gadget"})
    item_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/items/{item_id}")
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/items/{item_id}")
    assert get_resp.status_code == 404
