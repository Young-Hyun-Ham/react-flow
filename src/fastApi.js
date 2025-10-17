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
            // Failed to parse JSON, use status text
        }
        throw new Error(errorDetail);
    }
    if (response.status === 204) { // No Content
        return;
    }
    return response.json();
};

export const fetchScenarios = async () => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`);
    const data = await handleApiResponse(response);
    return data?.scenarios || (Array.isArray(data) ? data : []);
};

export const createScenario = async ({ newScenarioName, job, user }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            category_id: 'DEV_1000_S_1_1_1',
            name: newScenarioName,
            job: job,
            author_id: user.uid,
            author_name: user.displayName,
        }),
    });
    return handleApiResponse(response);
};

export const cloneScenario = async ({ scenarioToClone, newName, user }) => {
  const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      job: scenarioToClone.job,
      clone_from_id: scenarioToClone.id,
      category_id: 'DEV_1000_S_1_1_1',
      author_id: user.uid,
      author_name: user.displayName,
    }),
  });
  return handleApiResponse(response);
};

export const renameScenario = async ({ oldScenario, newName, job, user }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${oldScenario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: newName,
            job: job,
            updated_by: user.displayName,
            updated_by_id: user.uid,
        }),
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

export const saveScenarioData = async ({ scenario, data, user }) => {
    if (!scenario || !scenario.id) {
        throw new Error('No scenario selected to save.');
    }

    const payload = {
        ten_id: TENANT_ID,
        stg_id: STAGE_ID,
        category_id: "111",
        name: scenario.name,
        ...data,
        updated_by: user.displayName,
        updated_by_id: user.uid,
    };

    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleApiResponse(response);
};