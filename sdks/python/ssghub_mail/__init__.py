import requests
import json
from typing import Dict, Any, Optional

class SSGzoneMailClient:
    def __init__(self, api_key: str, base_url: str = "http://localhost:4000/api/v1", timeout: int = 30):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(
            method=method,
            url=url,
            json=data,
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def provision_tenant(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/tenant/provision', data)

    def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/user/create', data)

    def suspend_user(self, email: str) -> Dict[str, Any]:
        return self._request('POST', '/user/suspend', {'email': email})

__version__ = "1.0.0"