const API_BASE_URL = 'https://202.20.84.65:7082/api/v1/chat/scenarios';
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
    return data.scenarios || data;
};

export const createScenario = async ({ newScenarioName }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: '111', name: newScenarioName }),
    });
    return handleApiResponse(response);
};

export const renameScenario = async ({ oldScenario, newName }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${oldScenario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
    });
    return handleApiResponse(response);
};

export const deleteScenario = async ({ scenarioId }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

export const fetchScenarioData = async ({ scenarioId }) => {
    if (!scenarioId) return { nodes: [], edges: [] };
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`);
    return handleApiResponse(response);
};

// --- 💡 수정된 부분 시작 ---
export const saveScenarioData = async ({ scenario, data }) => {
    if (!scenario || !scenario.id) {
        throw new Error('No scenario selected to save.');
    }

    const payload = {
        ten_id: TENANT_ID,
        stg_id: STAGE_ID,
        category_id: "111",
        name: scenario.name, // name 필드 추가
        ...data,
    };

    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleApiResponse(response);
};
// --- 💡 수정된 부분 끝 ---