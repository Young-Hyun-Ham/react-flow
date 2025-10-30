// src/backendService.js

import * as firebaseApi from './firebaseApi';
import * as fastApi from './fastApi';
import { interpolateMessage, getNestedValue } from './simulatorUtils';
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
// <<< [수정] description 전달 ---
export const createScenario = (backend, args) => getService(backend).createScenario(args); // args에 description 포함되어 전달됨
export const renameScenario = (backend, args) => getService(backend).renameScenario(args); // args에 description 포함되어 전달됨
// --- [수정 끝] >>>
export const deleteScenario = (backend, args) => getService(backend).deleteScenario(args);
export const fetchScenarioData = (backend, args) => getService(backend).fetchScenarioData(args);
export const saveScenarioData = (backend, args) => getService(backend).saveScenarioData(args);
// <<< [수정] clone 시 description도 복사되도록 가정 (백엔드 로직에 따라 달라질 수 있음) ---
export const cloneScenario = (backend, args) => getService(backend).cloneScenario(args); // args에 description 정보 필요시 추가 전달
// --- [수정 끝] >>>

// --- 💡 [추가] ---
export const updateScenarioLastUsed = (backend, args) => getService(backend).updateScenarioLastUsed(args);
// --- 💡 [추가 끝] ---


// API 템플릿 함수들
export const fetchApiTemplates = firebaseApi.fetchApiTemplates;
export const saveApiTemplate = firebaseApi.saveApiTemplate;
export const deleteApiTemplate = firebaseApi.deleteApiTemplate;

// Form 템플릿 관련 함수들
export const fetchFormTemplates = firebaseApi.fetchFormTemplates;
export const saveFormTemplate = firebaseApi.saveFormTemplate;
export const deleteFormTemplate = firebaseApi.deleteFormTemplate;


export const testApiCall = async (apiCall) => {
  // ... (기존 API 테스트 로직) ...
  const { slots } = useStore.getState();
  const interpolatedUrl = interpolateMessage(apiCall.url, slots);
  const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', slots));

  const rawBody = apiCall.body || '{}';
  const finalBody = interpolateMessage(rawBody, slots);

  const options = {
    method: apiCall.method,
    headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
    body: (apiCall.method !== 'GET' && apiCall.method !== 'HEAD') ? finalBody : undefined,
  };

  const response = await fetch(interpolatedUrl, options);

  let result;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      try {
          result = await response.json();
      } catch (e) {
          result = await response.text();
      }
  } else {
      result = await response.text();
  }

  if (!response.ok) {
      const errorMessage = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
  }

  return result;
};