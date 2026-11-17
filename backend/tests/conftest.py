import pytest
import sys
import os

# Tambahkan parent directory ke path agar bisa import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

@pytest.fixture
def client():
    """Fixture untuk Flask test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def auth_headers():
    """Fixture untuk header autentikasi."""
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer DUMMY_TOKEN_FOR_TEST_STRUCTURE'
    }