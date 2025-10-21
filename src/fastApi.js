const API_BASE_URL = '/api/proxy/chat/scenarios';
const TENANT_ID = '1000';
const STAGE_ID = 'DEV';

const handleApiResponse = async (response) => {
    if (!response.ok) {
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail ? JSON.stringify(errorData.detail) : errorDetail;
        } catch (e) {
            // JSON 파싱 실패 시, 상태 코드로 오류 메시지 설정
        }
        throw new Error(errorDetail);
    }
    // DELETE와 같이 본문이 없는 성공 응답 처리
    if (response.status === 204) {
        return;
    }
    return response.json();
};

export const fetchScenarios = async () => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`);
    const data = await handleApiResponse(response);
    // FastAPI 응답 구조에 맞춰 scenarios 배열 또는 빈 배열 반환
    const scenarios = data?.scenarios || (Array.isArray(data) ? data : []);
     // job 속성이 없는 경우 'Process'를 기본값으로 설정 (클라이언트 측에서 처리)
    return scenarios.map(scenario => ({
       ...scenario,
       job: scenario.job || 'Process',
    }));
};

export const createScenario = async ({ newScenarioName, job }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // FastAPI 요청 본문에 맞게 수정 (start_node_id 추가)
        body: JSON.stringify({
            category_id: 'DEV_1000_S_1_1_1', // 필요시 수정
            name: newScenarioName,
            job: job,
            nodes: [],
            edges: [],
            start_node_id: null // FastAPI 스키마에 맞게 snake_case 사용
        }),
    });
    const data = await handleApiResponse(response);
    // 응답 데이터에 startNodeId (camelCase) 추가
    return { ...data, startNodeId: data.start_node_id };
};

// --- 💡 추가된 부분 시작 ---
export const cloneScenario = async ({ scenarioToClone, newName }) => {
  const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      job: scenarioToClone.job,
      clone_from_id: scenarioToClone.id, // 원본 ID를 포함하여 요청
      category_id: 'DEV_1000_S_1_1_1', // 필요시 수정
    }),
  });
  const data = await handleApiResponse(response);
   // 응답 데이터에 startNodeId (camelCase) 추가
  return { ...data, startNodeId: data.start_node_id };
};
// --- 💡 추가된 부분 끝 ---

export const renameScenario = async ({ oldScenario, newName, job }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${oldScenario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, job: job }), // FastAPI 필드에 맞게 전송
    });
    const data = await handleApiResponse(response);
    // 응답 데이터에 startNodeId (camelCase) 추가
    return { ...data, startNodeId: data.start_node_id };
};

export const deleteScenario = async ({ scenarioId }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response); // 성공 시 204 No Content 반환 예상
};

export const fetchScenarioData = async ({ scenarioId }) => {
    if (!scenarioId) return { nodes: [], edges: [], startNodeId: null };
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`);
    const data = await handleApiResponse(response);
    // FastAPI 응답에서 start_node_id를 startNodeId로 변환
    return {
        ...data,
        nodes: data.nodes || [],
        edges: data.edges || [],
        startNodeId: data.start_node_id || null
    };
};

export const saveScenarioData = async ({ scenario, data }) => {
    if (!scenario || !scenario.id) {
        throw new Error('No scenario selected to save.');
    }

    const payload = {
        ten_id: TENANT_ID, // FastAPI 스키마에 맞게 수정
        stg_id: STAGE_ID, // FastAPI 스키마에 맞게 수정
        category_id: "DEV_1000_S_1_1_1", // 필요시 수정
        name: scenario.name,
        job: scenario.job, // job 정보 추가
        nodes: data.nodes,
        edges: data.edges,
        start_node_id: data.startNodeId // FastAPI 스키마에 맞게 snake_case 사용
    };

    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const responseData = await handleApiResponse(response);
    // 응답 데이터에 startNodeId (camelCase) 추가
    return { ...responseData, startNodeId: responseData.start_node_id };
};