import https from 'https';

// 신뢰할 수 없는 인증서를 사용하는 API 서버의 기본 URL
const API_BASE_URL = 'https://202.20.84.65:7082/api/v1';

// Node.js 환경에서 SSL 인증서 검증을 무시하는 agent를 생성합니다.
const unsafeAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Vercel 서버리스 함수의 기본 핸들러
export default async function handler(req, res) {
  try {
    // 클라이언트가 요청한 경로를 가져옵니다. (예: /api/proxy/chat -> /chat)
    // req.url은 '/api/proxy' 이후의 경로를 포함합니다.
    const path = req.url.replace('/api/proxy', '');
    const apiUrl = `${API_BASE_URL}${path}`;

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // 클라이언트로부터 받은 Authorization 헤더가 있다면 그대로 전달
        'Authorization': req.headers.authorization || '',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      // ⚠️ SSL 검증을 무시하는 옵션 적용
      agent: unsafeAgent,
    });
    
    // FastAPI 서버의 응답 데이터를 가져옵니다.
    const data = await response.json();

    // 클라이언트에게 응답을 전달합니다.
    res.status(response.status).json(data);

  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: 'API request failed through proxy.' });
  }
}