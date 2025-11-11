const API_BASE_URL = '/api/proxy/chat/scenarios';
const TENANT_ID = '1000';
const STAGE_ID = 'DEV';

const handleApiResponse = async (response) => {
    // ... (기존 에러 핸들링 로직) ...
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
    if (response.status === 204) {
        return;
    }
    return response.json();
};

export const fetchScenarios = async () => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`);
    const data = await handleApiResponse(response);
    const scenarios = data?.scenarios || (Array.isArray(data) ? data : []);
    // <<< [수정] description 필드 추가 및 updatedAt/lastUsedAt 필드명 정규화 ---
    return scenarios.map(scenario => ({
       ...scenario,
       job: scenario.job || 'Process',
       description: scenario.description || '', // description 추가
       updatedAt: scenario.updated_at || null, // 'updated_at'을 'updatedAt'으로 정규화
       lastUsedAt: scenario.last_used_at || null, // 'last_used_at'을 'lastUsedAt'으로 정규화
    }));
    // --- [수정 끝] >>>
};

// <<< [수정] description 파라미터 추가 ---
export const createScenario = async ({ newScenarioName, job, description }) => {
// --- [수정 끝] >>>
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // <<< [수정] description 필드 추가 ---
        body: JSON.stringify({
            category_id: 'DEV_1000_S_1_1_1',
            name: newScenarioName,
            job: job,
            description: description, // description 추가
            nodes: [],
            edges: [],
            start_node_id: null
            // last_used_at은 백엔드에서 null로 자동 설정 가정
        }),
        // --- [수정 끝] >>>
    });
    const data = await handleApiResponse(response);
    // <<< [수정] 응답에 description 추가 및 updatedAt/lastUsedAt 정규화 ---
    return { ...data, startNodeId: data.start_node_id, description: data.description || '', updatedAt: data.updated_at || null, lastUsedAt: data.last_used_at || null };
    // --- [수정 끝] >>>
};

export const cloneScenario = async ({ scenarioToClone, newName }) => {
  const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // <<< [수정] 복제 요청 시 description 포함 (백엔드 스키마에 따라 달라질 수 있음) ---
    body: JSON.stringify({
      name: newName,
      job: scenarioToClone.job,
      clone_from_id: scenarioToClone.id,
      category_id: 'DEV_1000_S_1_1_1',
      description: scenarioToClone.description // 필요시 추가
      // last_used_at은 백엔드에서 null로 자동 설정 가정
    }),
    // --- [수정 끝] >>>
  });
  const data = await handleApiResponse(response);
  // <<< [수정] 응답에 description 추가 및 updatedAt/lastUsedAt 정규화 ---
  return { ...data, startNodeId: data.start_node_id, description: data.description || '', updatedAt: data.updated_at || null, lastUsedAt: data.last_used_at || null };
  // --- [수정 끝] >>>
};

// <<< [수정] description 파라미터 추가 ---
export const renameScenario = async ({ oldScenario, newName, job, description }) => {
// --- [수정 끝] >>>
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${oldScenario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // <<< [수정] 요청 본문에 description 추가 ---
        body: JSON.stringify({ name: newName, job: job, description: description }),
        // --- [수정 끝] >>>
    });
    const data = await handleApiResponse(response);
     // <<< [수정] 응답에 description 추가 및 updatedAt/lastUsedAt 정규화 ---
    return { ...data, startNodeId: data.start_node_id, description: data.description || '', updatedAt: data.updated_at || null, lastUsedAt: data.last_used_at || null };
     // --- [수정 끝] >>>
};

export const deleteScenario = async ({ scenarioId }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

export const fetchScenarioData = async ({ scenarioId }) => {
    if (!scenarioId) return { nodes: [], edges: [], startNodeId: null, description: '' }; // description 기본값 추가
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`);
    const data = await handleApiResponse(response);
    // <<< [수정] description 로드 추가 및 updatedAt/lastUsedAt 정규화 ---
    return {
        ...data,
        nodes: data.nodes || [],
        edges: data.edges || [],
        startNodeId: data.start_node_id || null,
        description: data.description || '', // description 추가
        updatedAt: data.updated_at || null,
        lastUsedAt: data.last_used_at || null
    };
    // --- [수정 끝] >>>
};

export const saveScenarioData = async ({ scenario, data }) => {
    if (!scenario || !scenario.id) {
        throw new Error('No scenario selected to save.');
    }

    // <<< [수정] payload에 description 포함 ---
    const payload = {
        ten_id: TENANT_ID,
        stg_id: STAGE_ID,
        category_id: "DEV_1000_S_1_1_1",
        name: scenario.name,
        job: scenario.job,
        description: scenario.description || '', // description 추가
        nodes: data.nodes,
        edges: data.edges,
        start_node_id: data.startNodeId
        // save는 updatedAt만 갱신 (백엔드 로직)
    };
    // --- [수정 끝] >>>

    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const responseData = await handleApiResponse(response);
    // <<< [수정] 응답에 description 추가 및 updatedAt/lastUsedAt 정규화 ---
    return { ...responseData, startNodeId: responseData.start_node_id, description: responseData.description || '', updatedAt: responseData.updated_at || null, lastUsedAt: responseData.last_used_at || null };
    // --- [수정 끝] >>>
};

// --- 💡 [추가] lastUsedAt 업데이트 함수 (PATCH 사용) ---
export const updateScenarioLastUsed = async ({ scenarioId }) => {
  const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    // 백엔드가 last_used_at 필드를 현재 시간으로 업데이트하도록 요청
    // (이 API 명세는 FastAPI Docs에 정의되어 있어야 함)
    body: JSON.stringify({ last_used_at: new Date().toISOString() }), 
  });
  const data = await handleApiResponse(response);
  return { ...data, startNodeId: data.start_node_id, description: data.description || '', updatedAt: data.updated_at || null, lastUsedAt: data.last_used_at || null };
};
// --- 💡 [추가 끝] ---

// --- 💡 [추가] FastAPI용 템플릿 함수 (임시 구현) ---
const notImplemented = () => {
    console.warn("FastAPI 템플릿 기능은 아직 구현되지 않았습니다.");
    return Promise.resolve([]); // 우선 빈 배열 반환
};

export const fetchApiTemplates = notImplemented;
export const saveApiTemplate = notImplemented;
export const deleteApiTemplate = notImplemented;
export const fetchFormTemplates = notImplemented;
export const saveFormTemplate = notImplemented;
export const deleteFormTemplate = notImplemented;
// --- 💡 [추가 끝] ---