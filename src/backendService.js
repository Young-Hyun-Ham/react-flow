import * as firebaseApi from './firebaseApi';
import * as fastApi from './fastApi';
import { interpolateMessage, getNestedValue } from './simulatorUtils'; // getNestedValue import
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
export const cloneScenario = (backend, args) => getService(backend).cloneScenario(args);


// API 템플릿 함수들
export const fetchApiTemplates = firebaseApi.fetchApiTemplates;
export const saveApiTemplate = firebaseApi.saveApiTemplate;
export const deleteApiTemplate = firebaseApi.deleteApiTemplate;

// Form 템플릿 관련 함수들
export const fetchFormTemplates = firebaseApi.fetchFormTemplates;
export const saveFormTemplate = firebaseApi.saveFormTemplate;
export const deleteFormTemplate = firebaseApi.deleteFormTemplate;


// --- 💡 수정된 부분 시작 ---
export const testApiCall = async (apiCall) => {
  const { slots } = useStore.getState();

  const interpolatedUrl = interpolateMessage(apiCall.url, slots);
  const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', slots));
  
  // Body 처리 로직 수정
  const rawBody = apiCall.body || '{}';
  const interpolatedBodyString = JSON.stringify(JSON.parse(rawBody), (key, value) => {
      if (typeof value === 'string') {
          return value.replace(/{{([^}]+)}}/g, (match, slotKey) => {
              const slotValue = getNestedValue(slots, slotKey);
              return typeof slotValue === 'string' ? slotValue : `___SLOT___${slotKey}`;
          });
      }
      return value;
  });

  const finalBody = interpolatedBodyString.replace(/"___SLOT___([^"]+)"/g, (match, slotKey) => {
    const slotValue = getNestedValue(slots, slotKey);
    return JSON.stringify(slotValue);
  });

  const options = {
    method: apiCall.method,
    headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
    body: apiCall.method !== 'GET' ? finalBody : undefined,
  };

  const response = await fetch(interpolatedUrl, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(result, null, 2)}`);
  }
  
  return result;
};
// --- 💡 수정된 부분 끝 ---