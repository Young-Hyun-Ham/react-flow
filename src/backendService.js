import * as firebaseApi from './firebaseApi';
import * as fastApi from './fastApi';
import { interpolateMessage } from './simulatorUtils';
import useStore from './store';

const services = {
  firebase: firebaseApi,
  fastapi: fastApi,
};

const getService = (backend) => {
  const service = services[backend];
  if (!service) {
    throw new Error(`Invalid backend specified: ${backend}`);
  }
  return service;
};

export const fetchScenarios = (backend, args) => getService(backend).fetchScenarios(args);
export const createScenario = (backend, args) => getService(backend).createScenario(args);
export const renameScenario = (backend, args) => getService(backend).renameScenario(args);
export const deleteScenario = (backend, args) => getService(backend).deleteScenario(args);
export const fetchScenarioData = (backend, args) => getService(backend).fetchScenarioData(args);
export const saveScenarioData = (backend, args) => getService(backend).saveScenarioData(args);

// FastAPI에는 템플릿 기능이 없으므로, firebaseApi를 직접 사용합니다.
export const fetchApiTemplates = firebaseApi.fetchApiTemplates;
export const saveApiTemplate = firebaseApi.saveApiTemplate;
export const deleteApiTemplate = firebaseApi.deleteApiTemplate;

// 💡[추가된 부분] API 테스트를 위한 공통 함수
export const testApiCall = async (apiCall) => {
  // Zustand 스토어에서 직접 상태 가져오기
  const { slots } = useStore.getState();

  const interpolatedUrl = interpolateMessage(apiCall.url, slots);
  const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', slots));
  const interpolatedBody = apiCall.method !== 'GET' && apiCall.body ? interpolateMessage(apiCall.body, slots) : undefined;

  const options = {
    method: apiCall.method,
    headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
    body: interpolatedBody,
  };

  const response = await fetch(interpolatedUrl, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(result, null, 2)}`);
  }
  
  return result;
};