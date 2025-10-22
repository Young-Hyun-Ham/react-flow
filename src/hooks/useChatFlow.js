// src/hooks/useChatFlow.js

import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store';
// --- 👇 [수정] interpolateMessageForApi 제거, interpolateMessage 만 사용 ---
import { interpolateMessage, getNestedValue, evaluateCondition } from '../simulatorUtils';

export const useChatFlow = (nodes, edges) => {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fixedMenu, setFixedMenu] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const { slots, setSlots, anchorNodeId, startNodeId } = useStore();
  const currentNode = nodes.find(n => n.id === currentId);

  const handleApiNode = useCallback(async (node, currentSlots) => {
    const loadingId = Date.now();
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
    let finalSlots = { ...currentSlots };
    try {
        const { isMulti, apis } = node.data;

        const processApiCall = (apiCall) => {
            // --- 👇 [수정] interpolateMessage 사용 ---
            const interpolatedUrl = interpolateMessage(apiCall.url, currentSlots);
            const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', currentSlots));
            // --- 👆 [수정 끝] ---

            const rawBody = apiCall.body || '{}';
            let finalBody;
             try {
                // 문자열 내 {{slot}} 치환 후 JSON 파싱
                // --- 👇 [수정] interpolateMessage 사용 ---
                const interpolatedBodyString = JSON.stringify(JSON.parse(rawBody), (key, value) => {
                    if (typeof value === 'string') {
                        // interpolateMessage 함수는 이제 {{}}를 처리하므로 그대로 사용
                        return interpolateMessage(value, currentSlots);
                    }
                    return value;
                });
                // --- 👆 [수정 끝] ---
                 // 값 복원 로직은 {{}} 구문과 getNestedValue가 처리하므로 단순화 가능
                 finalBody = interpolatedBodyString;
             } catch (e) {
                 console.error("Error processing API body:", e);
                 throw new Error(`Invalid JSON body format: ${e.message}`);
             }

            return fetch(interpolatedUrl, {
                method: apiCall.method,
                headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
                body: apiCall.method !== 'GET' && apiCall.method !== 'HEAD' ? finalBody : undefined,
            }).then(async res => { // async 추가
                const resBody = await res.json().catch(() => null); // JSON 파싱 실패 대비
                if (!res.ok) {
                    const errorDetail = resBody ? (resBody.detail || JSON.stringify(resBody)) : res.statusText;
                    throw new Error(`API call '${apiCall.name || 'Unnamed'}' failed with status ${res.status}: ${errorDetail}`);
                 }
                return { data: resBody, mapping: apiCall.responseMapping, apiName: apiCall.name };
            });
        };

        const promises = isMulti ? (apis || []).map(processApiCall) : [processApiCall(node.data)];
        const results = await Promise.allSettled(promises);

        const failedCalls = results.filter(r => r.status === 'rejected');
        if (failedCalls.length > 0) {
             throw new Error(failedCalls[0].reason.message || `API call '${failedCalls[0].reason.apiName || 'Unnamed'}' failed.`);
        }

        const newSlots = {};
        results.forEach(res => {
            if (res.status === 'fulfilled') {
                const { data, mapping } = res.value;
                (mapping || []).forEach(m => {
                    if (m.path && m.slot) {
                        const value = getNestedValue(data, m.path);
                        if (value !== undefined) newSlots[m.slot] = value;
                    }
                });
            }
        });

        finalSlots = { ...currentSlots, ...newSlots };
        setSlots(finalSlots);
        setHistory(prev => prev.filter(item => item.id !== loadingId));
        proceedToNextNode('onSuccess', node.id, finalSlots);
    } catch (error) {
        console.error("API Error:", error);
        setHistory(prev => prev.filter(item => item.id !== loadingId));
        setHistory(prev => [...prev, { type: 'bot', message: `API Error: ${error.message}`, id: loadingId }]);
        proceedToNextNode('onError', node.id, finalSlots);
    }
  // --- 👇 [수정] 의존성 배열에서 proceedToNextNode 제거 ---
  }, [setSlots, nodes, edges, anchorNodeId]);


  const handleLlmNode = useCallback(async (node, currentSlots) => {
    const streamingMessageId = Date.now();
    let accumulatedContent = '';
    setHistory(prev => [...prev, { type: 'bot_streaming', id: streamingMessageId, content: '', isStreaming: true }]);
    try {
        // --- 👇 [수정] interpolateMessage 사용 ---
        const interpolatedPrompt = interpolateMessage(node.data.prompt, currentSlots);
        // --- 👆 [수정 끝] ---
        const response = await fetch('/api/proxy/chat/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ten_id: "1000",
                stg_id: "DEV",
                prompt: interpolatedPrompt,
                model_name: "gpt-4o",
                stream: true
             }),
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(`LLM API Error ${response.status}: ${errorBody.detail || 'Unknown error'}`);
        }
        if (!response.body) throw new Error('ReadableStream not available');

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
             try {
                 const lines = value.split('\n');
                 for (const line of lines) {
                     if (line.startsWith('data: ')) {
                         const jsonString = line.substring(6);
                         if (jsonString === '[DONE]') break;
                         const jsonData = JSON.parse(jsonString);
                         if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                             accumulatedContent += jsonData.choices[0].delta.content;
                             setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent } : item));
                         }
                     }
                 }
             } catch (e) {
                 console.error("Error parsing LLM stream chunk:", e, "Chunk:", value);
             }
        }
    } catch (error) {
        console.error("LLM Error:", error);
        accumulatedContent = `LLM Error: ${error.message}`;
    } finally {
        setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent, isStreaming: false } : item));
        let finalSlots = { ...currentSlots };
        if (node.data.outputVar) {
            finalSlots[node.data.outputVar] = accumulatedContent;
            setSlots(finalSlots);
        }
        proceedToNextNode(null, node.id, finalSlots);
    }
  // --- 👇 [수정] 의존성 배열에서 proceedToNextNode 제거 ---
  }, [setSlots, nodes, edges, anchorNodeId]);


  const addBotMessageRef = useRef(null);

  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots) => {
    // ... (이 함수 내부는 변경 없음) ...
    if (sourceNodeId === anchorNodeId) {
        setCurrentId(null);
        return;
    }
    if (!sourceNodeId) return;
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    let nextEdge;
    if (sourceNode && sourceNode.type === 'llm' && sourceNode.data.conditions?.length > 0) {
        const llmOutput = updatedSlots[sourceNode.data.outputVar] || '';
        const matchedCondition = sourceNode.data.conditions.find(cond =>
            llmOutput.toLowerCase().includes(cond.keyword.toLowerCase())
        );
        if (matchedCondition) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === matchedCondition.id);
        }
    }
    if (sourceNode && sourceNode.type === 'branch' && sourceNode.data.evaluationType === 'CONDITION') {
        const conditions = sourceNode.data.conditions || [];
        for (const condition of conditions) {
            const slotValue = getNestedValue(updatedSlots, condition.slot);
            if (evaluateCondition(slotValue, condition.operator, condition, updatedSlots)) {
                const matchingReply = sourceNode.data.replies[conditions.indexOf(condition)];
                const handleId = matchingReply?.value;
                if(handleId) {
                  nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === handleId);
                  if (nextEdge) break;
                }
            }
        }
         if (!nextEdge) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === 'default');
         }
    }
    if (!nextEdge) {
        if (sourceHandleId) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId);
        } else {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === 'default') ||
                       edges.find(edge => edge.source === sourceNodeId && !edge.sourceHandle);
        }
    }
    if (nextEdge) {
      const nextNode = nodes.find(node => node.id === nextEdge.target);
      if (nextNode) {
        setCurrentId(nextNode.id);
        if (addBotMessageRef.current) {
             setTimeout(() => addBotMessageRef.current(nextNode.id, updatedSlots), 500);
        }
      } else {
         console.warn(`Next node with id ${nextEdge.target} not found.`);
         setCurrentId(null);
      }
    } else {
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      if (sourceNode?.parentNode) {
         const parentEdge = edges.find(edge => edge.source === sourceNode.parentNode);
         if (parentEdge) {
             proceedToNextNode(parentEdge.sourceHandle, sourceNode.parentNode, updatedSlots);
         } else {
            setCurrentId(null);
         }
        return;
      }
      if(sourceNode?.type !== 'fixedmenu' && sourceNode?.type !== 'form' && sourceNode?.type !== 'slotfilling' && !(sourceNode?.type === 'branch' && sourceNode.data.evaluationType === 'BUTTON')) {
        setTimeout(() => setCurrentId(null), 500);
      }
    }
  // --- 👇 [수정] 의존성 배열 변경 없음 (이전과 동일) ---
  }, [edges, nodes, anchorNodeId]);


  const addBotMessage = useCallback((nodeId, updatedSlots) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.type === 'start') {
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
    }

    if (node.type === 'scenario') {
      const childNodes = nodes.filter(n => n.parentNode === node.id);
      const childNodeIds = new Set(childNodes.map(n => n.id));
      const startNode = childNodes.find(n =>
        !edges.some(e => e.target === n.id && childNodeIds.has(e.source))
      );
      if (startNode) {
        setCurrentId(startNode.id);
        addBotMessageRef.current(startNode.id, updatedSlots);
      } else {
        proceedToNextNode(null, node.id, updatedSlots);
      }
      return;
    }

    if (node.type === 'api') {
      handleApiNode(node, updatedSlots);
      return;
    }
    if (node.type === 'llm') {
      handleLlmNode(node, updatedSlots);
      return;
    }
    if (node.type === 'setSlot') {
        const newSlots = { ...updatedSlots };
        node.data.assignments?.forEach(assignment => {
            if (assignment.key) {
                // --- 👇 [수정] interpolateMessage 사용 ---
                const interpolatedValue = interpolateMessage(assignment.value, updatedSlots);
                // --- 👆 [수정 끝] ---
                try {
                    const trimmedValue = interpolatedValue.trim();
                    if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) || (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
                        newSlots[assignment.key] = JSON.parse(trimmedValue);
                    } else {
                        if (trimmedValue.toLowerCase() === 'true') newSlots[assignment.key] = true;
                        else if (trimmedValue.toLowerCase() === 'false') newSlots[assignment.key] = false;
                        else if (!isNaN(trimmedValue) && trimmedValue !== '') newSlots[assignment.key] = Number(trimmedValue);
                        else newSlots[assignment.key] = interpolatedValue;
                    }
                } catch (e) {
                    newSlots[assignment.key] = interpolatedValue;
                }
            }
        });
        setSlots(newSlots);
        proceedToNextNode(null, nodeId, newSlots);
        return;
    }

    if (node.type === 'form') {
      let initialSlotsUpdate = {};
      (node.data.elements || []).forEach(element => {
        if (element.type === 'input' && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
          const defaultValueConfig = element.defaultValue;
          let resolvedValue;
          // --- 👇 [수정] 슬롯 참조 구문 변경 ({slot} -> {{slot}}) 반영 확인 ---
          // 여기서는 Default Value 문자열 자체에 슬롯 구문이 있는지 확인하는 것이 아니라,
          // interpolateMessage 함수가 {{}}를 처리하도록 수정되었으므로, 해당 함수를 호출하여 처리합니다.
          // const slotMatch = typeof defaultValueConfig === 'string' ? defaultValueConfig.match(/^\{(.+)\}$/) : null; // 이전 코드
          // if (slotMatch) { ... } // 이전 코드
          // --- 👇 [수정] interpolateMessage 사용 ---
          resolvedValue = interpolateMessage(defaultValueConfig, updatedSlots);
          // --- 👆 [수정 끝] ---

          if (resolvedValue !== undefined) {
             initialSlotsUpdate[element.name] = resolvedValue;
          }
        }
        else if ((element.type === 'date' || element.type === 'dropbox') && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
            // date, dropbox는 슬롯 치환이 필요 없을 수 있지만, 일관성을 위해 추가 (필요시 제거)
             initialSlotsUpdate[element.name] = interpolateMessage(String(element.defaultValue), updatedSlots);
        } else if (element.type === 'checkbox' && element.name && Array.isArray(element.defaultValue)) {
             // checkbox 기본값은 배열이므로 치환하지 않음
              initialSlotsUpdate[element.name] = element.defaultValue;
        }
      });

      const finalSlotsForForm = { ...updatedSlots, ...initialSlotsUpdate };
      if (Object.keys(initialSlotsUpdate).length > 0) {
        setSlots(finalSlotsForForm); // Update global state
      }

      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: false, id: Date.now() }]);
      return;
    }

    if (node.type === 'fixedmenu') {
      setHistory([]);
      setFixedMenu({ nodeId: node.id, ...node.data });
      setCurrentId(node.id);
      return;
    }
    if (node.type === 'link') {
      // --- 👇 [수정] interpolateMessage 사용 ---
      const url = interpolateMessage(node.data.content, updatedSlots);
      const display = interpolateMessage(node.data.display, updatedSlots);
      // --- 👆 [수정 끝] ---
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: true, id: Date.now(), linkData: { url, display } }]);
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
      proceedToNextNode(null, nodeId, updatedSlots);
      return;
    }
    if (node.type === 'toast') {
      // --- 👇 [수정] interpolateMessage 사용 ---
      const message = interpolateMessage(node.data.message, updatedSlots);
      // --- 👆 [수정 끝] ---
      alert(`[${node.data.toastType || 'info'}] ${message}`);
      proceedToNextNode(null, nodeId, updatedSlots);
      return;
    }
    if (node.type === 'branch' && node.data.evaluationType === 'CONDITION') {
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
    }

    const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.evaluationType === 'BUTTON' && node.data.replies?.length > 0) || node.type === 'slotfilling';
    if (node.type !== 'form') {
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: !isInteractive || node.type === 'iframe', id: Date.now() }]);
    }

    if (!isInteractive && node.type !== 'fixedmenu' && node.type !== 'form') {
        setTimeout(() => proceedToNextNode(null, nodeId, updatedSlots), 100);
    }

  // --- 👇 [수정] 의존성 배열 변경 (proceedToNextNode 포함) ---
  }, [nodes, edges, setSlots, handleApiNode, handleLlmNode, proceedToNextNode]);

  useEffect(() => {
    addBotMessageRef.current = addBotMessage;
  }, [addBotMessage]);


  const startSimulation = useCallback(() => {
    setIsStarted(true);
    let effectiveStartNodeId = startNodeId;
    if (!effectiveStartNodeId) {
      let startNode = nodes.find(n => n.type === 'start');
      if (!startNode) {
          startNode = nodes.find(n => !edges.some(e => e.target === n.id) && !n.parentNode);
      }
      effectiveStartNodeId = startNode?.id;
    }
    if (effectiveStartNodeId) {
      setSlots({});
      setFixedMenu(null);
      setHistory([]);
      setCurrentId(effectiveStartNodeId);
      if (addBotMessageRef.current) {
          addBotMessageRef.current(effectiveStartNodeId, {});
      }
    } else {
        console.warn("No start node found for simulation.");
        setIsStarted(false);
    }
  // --- 👇 [수정] 의존성 배열 변경 없음 ---
  }, [nodes, edges, setSlots, startNodeId]);

  useEffect(() => {
    setIsStarted(false);
    setHistory([]);
  }, [nodes, edges]);

  return {
    history, setHistory, currentId, currentNode, fixedMenu, isStarted, startSimulation, proceedToNextNode
  };
};