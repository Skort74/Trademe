def test_health_check(client):
    """Test endpoint health check mengembalikan 200 OK."""
    response = client.get('/api/health')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'