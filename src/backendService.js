// src/backendService.js

import * as firebaseApi from './firebaseApi';
import * as fastApi from './fastApi';
// --- 👇 [수정] interpolateMessageForApi 제거 ---
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


export const testApiCall = async (apiCall) => {
  const { slots } = useStore.getState();

  // --- 👇 [수정] interpolateMessage 사용 ---
  const interpolatedUrl = interpolateMessage(apiCall.url, slots);
  const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', slots));

  const rawBody = apiCall.body || '{}';
  // Body 처리 로직은 interpolateMessage가 {{}}를 처리하므로 단순화 가능
  const finalBody = interpolateMessage(rawBody, slots);
  // --- 👆 [수정 끝] ---


  const options = {
    method: apiCall.method,
    headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
    // GET, HEAD 메서드가 아닐 경우에만 body 포함
    body: (apiCall.method !== 'GET' && apiCall.method !== 'HEAD') ? finalBody : undefined,
  };

  const response = await fetch(interpolatedUrl, options);

  // --- 👇 [수정] 응답 본문 파싱 개선 ---
  let result;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      try {
          result = await response.json();
      } catch (e) {
          // JSON 파싱 실패 시 텍스트로 처리
          result = await response.text();
      }
  } else {
      result = await response.text();
  }
  // --- 👆 [수정 끝] ---

  if (!response.ok) {
      // 오류 메시지를 좀 더 명확하게
      const errorMessage = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
  }

  return result;
};