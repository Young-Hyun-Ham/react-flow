// 호출하려는 HTTP API 서버의 주소
const API_BASE_URL = 'http://202.20.84.65:8082/api/v1/chat/scenarios/1000/DEV';

export default async function handler(req, res) {
  try {
    const path = req.url.replace('/api/proxy', '');
    const apiUrl = `${API_BASE_URL}${path}`;

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: 'API request failed through proxy.' });
  }
}