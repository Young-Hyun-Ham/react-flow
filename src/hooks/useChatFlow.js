// src/hooks/useChatFlow.js

import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store';
// --- 👇 [수정] evaluateCondition 추가 ---
import { interpolateMessage, interpolateMessageForApi, getNestedValue, evaluateCondition } from '../simulatorUtils';

export const useChatFlow = (nodes, edges) => {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fixedMenu, setFixedMenu] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const { slots, setSlots, anchorNodeId, startNodeId } = useStore();
  const currentNode = nodes.find(n => n.id === currentId);

  // --- handleApiNode와 handleLlmNode를 useCallback 밖으로 이동시키거나, ---
  // --- proceedToNextNode와 addBotMessage보다 먼저 useCallback으로 정의합니다. ---
  const handleApiNode = useCallback(async (node, currentSlots) => {
    const loadingId = Date.now();
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
    let finalSlots = { ...currentSlots };
    try {
        const { isMulti, apis } = node.data;

        const processApiCall = (apiCall) => {
            const interpolatedUrl = interpolateMessageForApi(apiCall.url, currentSlots);
            const interpolatedHeaders = JSON.parse(interpolateMessageForApi(apiCall.headers || '{}', currentSlots));

            const rawBody = apiCall.body || '{}';
            let finalBody;
             try {
                // 문자열 내 {{slot}} 치환 후 JSON 파싱
                const interpolatedBodyString = JSON.stringify(JSON.parse(rawBody), (key, value) => {
                    if (typeof value === 'string') {
                        return value.replace(/{{([^}]+)}}/g, (match, slotKey) => {
                            const slotValue = getNestedValue(currentSlots, slotKey);
                            // 객체나 배열이면 특수 마커 사용, 아니면 문자열 그대로 반환
                            return typeof slotValue === 'object' && slotValue !== null ? `___SLOT_${JSON.stringify(slotValue)}___` : String(slotValue ?? match);
                        });
                    }
                    return value;
                });
                 // 특수 마커를 실제 값으로 복원
                 finalBody = interpolatedBodyString.replace(/"___SLOT_([^"]+?)___"/g, (match, jsonString) => {
                     try {
                         // 추가 이스케이프 제거
                         return jsonString.replace(/\\"/g, '"');
                     } catch (e) {
                         console.error("Error parsing slot marker", e);
                         return '""'; // 복원 실패 시 빈 문자열
                     }
                 });
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
                    // 오류 응답 처리 개선
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
            // 여러 실패 중 첫 번째 실패 메시지를 사용
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
        setHistory(prev => prev.filter(item => item.id !== loadingId)); // 로딩 메시지 제거
        // proceedToNextNode는 아래에서 정의되므로 직접 호출
        proceedToNextNode('onSuccess', node.id, finalSlots);
    } catch (error) {
        console.error("API Error:", error);
        setHistory(prev => prev.filter(item => item.id !== loadingId)); // 로딩 메시지 제거
        // 오류 메시지를 봇 메시지로 표시
        setHistory(prev => [...prev, { type: 'bot', message: `API Error: ${error.message}`, id: loadingId }]);
        // proceedToNextNode는 아래에서 정의되므로 직접 호출
        proceedToNextNode('onError', node.id, finalSlots);
    }
  }, [setSlots, nodes, edges, anchorNodeId]); // proceedToNextNode 제거, nodes, edges, anchorNodeId 추가


  const handleLlmNode = useCallback(async (node, currentSlots) => {
    const streamingMessageId = Date.now();
    let accumulatedContent = '';
    setHistory(prev => [...prev, { type: 'bot_streaming', id: streamingMessageId, content: '', isStreaming: true }]);
    try {
        const interpolatedPrompt = interpolateMessage(node.data.prompt, currentSlots);
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
         // proceedToNextNode는 아래에서 정의되므로 직접 호출
        proceedToNextNode(null, node.id, finalSlots);
    }
  }, [setSlots, nodes, edges, anchorNodeId]); // proceedToNextNode 제거, nodes, edges, anchorNodeId 추가


  // proceedToNextNode와 addBotMessage는 서로를 호출하므로, forwardRef나 다른 상태 관리 기법이 이상적일 수 있으나,
  // 우선 정의 순서를 조정하고 의존성 배열에서 서로를 제거하여 오류를 해결합니다.
  // useRef를 사용하여 최신 함수 참조를 유지하는 방법도 고려할 수 있습니다.

  // Mutable ref to hold the latest addBotMessage function
  const addBotMessageRef = useRef(null);

  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots) => {
    if (sourceNodeId === anchorNodeId) {
        setCurrentId(null);
        return;
    }

    if (!sourceNodeId) return;

    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    let nextEdge;

    // ... (기존 nextEdge 찾는 로직은 동일) ...
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
            const slotValue = getNestedValue(updatedSlots, condition.slot); // Use getNestedValue for consistency
            if (evaluateCondition(slotValue, condition.operator, condition, updatedSlots)) {
                // --- 👇 [수정] conditions 배열과 replies 배열 인덱스 동기화 가정 제거 ---
                // 조건에 맞는 reply의 value를 찾아서 sourceHandleId로 사용
                const matchingReply = sourceNode.data.replies[conditions.indexOf(condition)];
                const handleId = matchingReply?.value;
                // --- 👆 [수정 끝] ---
                if(handleId) {
                  nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === handleId);
                  if (nextEdge) break;
                }
            }
        }
         // If no condition matched, check for a default edge
         if (!nextEdge) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === 'default');
         }
    }

     // Default edge finding logic if no specific handle matched yet
    if (!nextEdge) {
        if (sourceHandleId) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId);
        } else {
             // Try 'default' first for LLM/API nodes, then no handle
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === 'default') ||
                       edges.find(edge => edge.source === sourceNodeId && !edge.sourceHandle);
        }
    }


    if (nextEdge) {
      const nextNode = nodes.find(node => node.id === nextEdge.target);
      if (nextNode) {
        setCurrentId(nextNode.id);
        // Use the ref to call the latest addBotMessage
        if (addBotMessageRef.current) {
             setTimeout(() => addBotMessageRef.current(nextNode.id, updatedSlots), 500);
        }
      } else {
         console.warn(`Next node with id ${nextEdge.target} not found.`);
         setCurrentId(null); // Stop simulation if next node is missing
      }
    } else {
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      // If the source node is inside a group, try moving out of the group
      if (sourceNode?.parentNode) {
         // Find the edge originating from the parent group node
         const parentEdge = edges.find(edge => edge.source === sourceNode.parentNode);
         if (parentEdge) {
            // Proceed from the parent node using its edge
             proceedToNextNode(parentEdge.sourceHandle, sourceNode.parentNode, updatedSlots);
         } else {
            // No outgoing edge from parent, end simulation
            setCurrentId(null);
         }
        return;
      }
      // If it's not a node type that waits for user input, end the flow
      if(sourceNode?.type !== 'fixedmenu' && sourceNode?.type !== 'form' && sourceNode?.type !== 'slotfilling' && !(sourceNode?.type === 'branch' && sourceNode.data.evaluationType === 'BUTTON')) {
        setTimeout(() => setCurrentId(null), 500); // End simulation after a short delay
      }
    }
  // <<< [수정] 의존성 배열에서 addBotMessage 제거, nodes, edges, anchorNodeId 추가 >>>
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

      // Find the "start" node within the group (no incoming edge *within* the group)
      const startNode = childNodes.find(n =>
        !edges.some(e => e.target === n.id && childNodeIds.has(e.source))
      );

      if (startNode) {
        setCurrentId(startNode.id);
        // Call addBotMessage for the child start node
        addBotMessageRef.current(startNode.id, updatedSlots); // Use ref here
      } else {
        // If no start node found inside, proceed from the group node itself
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
                const interpolatedValue = interpolateMessage(assignment.value, updatedSlots);
                try {
                    // Check if the interpolated value looks like JSON object or array
                    const trimmedValue = interpolatedValue.trim();
                    if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) || (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
                        newSlots[assignment.key] = JSON.parse(trimmedValue);
                    } else {
                        // Handle potential boolean or number conversions, otherwise keep as string
                        if (trimmedValue.toLowerCase() === 'true') {
                            newSlots[assignment.key] = true;
                        } else if (trimmedValue.toLowerCase() === 'false') {
                             newSlots[assignment.key] = false;
                        } else if (!isNaN(trimmedValue) && trimmedValue !== '') {
                            newSlots[assignment.key] = Number(trimmedValue);
                        } else {
                            newSlots[assignment.key] = interpolatedValue; // Keep as string if not JSON, boolean, or number
                        }
                    }
                } catch (e) {
                     // If JSON parsing fails or other errors, treat as string
                    newSlots[assignment.key] = interpolatedValue;
                }
            }
        });
        setSlots(newSlots);
        proceedToNextNode(null, nodeId, newSlots);
        return;
    }
    // --- 👇 [수정 시작] Form 노드 Default Value 처리 로직 (덮어쓰기 적용) ---
    if (node.type === 'form') {
      let initialSlotsUpdate = {};
      (node.data.elements || []).forEach(element => {
        if (element.type === 'input' && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
          const defaultValueConfig = element.defaultValue;
          let resolvedValue;
          const slotMatch = typeof defaultValueConfig === 'string' ? defaultValueConfig.match(/^\{(.+)\}$/) : null;

          if (slotMatch) {
            resolvedValue = getNestedValue(updatedSlots, slotMatch[1]);
          } else {
            resolvedValue = defaultValueConfig;
          }

          // --- 👇 [수정] 기존 슬롯 값 존재 여부 체크 제거 (항상 덮어쓰기) ---
          if (resolvedValue !== undefined) {
             initialSlotsUpdate[element.name] = resolvedValue;
          }
          // --- 👆 [수정 끝] ---
        }
        else if ((element.type === 'date' || element.type === 'dropbox') && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
             // --- 👇 [수정] 기존 슬롯 값 존재 여부 체크 제거 (항상 덮어쓰기) ---
             // if (updatedSlots[element.name] === undefined) {
                  initialSlotsUpdate[element.name] = element.defaultValue;
             // }
             // --- 👆 [수정 끝] ---
        } else if (element.type === 'checkbox' && element.name && Array.isArray(element.defaultValue)) {
             // --- 👇 [수정] 기존 슬롯 값 존재 여부 체크 제거 (항상 덮어쓰기) ---
              // if (updatedSlots[element.name] === undefined) {
                  initialSlotsUpdate[element.name] = element.defaultValue;
              // }
             // --- 👆 [수정 끝] ---
        }
      });

      const finalSlotsForForm = { ...updatedSlots, ...initialSlotsUpdate };
      if (Object.keys(initialSlotsUpdate).length > 0) {
        setSlots(finalSlotsForForm); // Update global state
      }

      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: false, id: Date.now() }]);
      // Stop here for form node, wait for user input
      return;
    }
    // --- 👆 [수정 끝] ---

    if (node.type === 'fixedmenu') {
      setHistory([]);
      setFixedMenu({ nodeId: node.id, ...node.data });
      setCurrentId(node.id);
      return;
    }
    if (node.type === 'link') {
      const url = interpolateMessage(node.data.content, updatedSlots);
      const display = interpolateMessage(node.data.display, updatedSlots);
      // Add message immediately, mark as completed
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: true, id: Date.now(), linkData: { url, display } }]);
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
      // Proceed immediately after adding message and opening link
      proceedToNextNode(null, nodeId, updatedSlots);
      return;
    }
    if (node.type === 'toast') {
      const message = interpolateMessage(node.data.message, updatedSlots);
      alert(`[${node.data.toastType || 'info'}] ${message}`);
      proceedToNextNode(null, nodeId, updatedSlots);
      return;
    }
    if (node.type === 'branch' && node.data.evaluationType === 'CONDITION') {
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
    }

    // Add message to history
    const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.evaluationType === 'BUTTON' && node.data.replies?.length > 0) || node.type === 'slotfilling';
    // --- 👇 [수정] form 타입 메시지 추가는 위에서 처리했으므로 제외 ---
    if (node.type !== 'form') {
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: !isInteractive || node.type === 'iframe', id: Date.now() }]);
    }
    // --- 👆 [수정 끝] ---


    // --- Automatically proceed for non-interactive nodes after adding message ---
    // --- 👇 [수정] form 타입 제외 ---
    if (!isInteractive && node.type !== 'fixedmenu' && node.type !== 'form') { // Don't auto-proceed from fixedmenu or form
        // Delay slightly before proceeding to allow message rendering
        setTimeout(() => proceedToNextNode(null, nodeId, updatedSlots), 100); // Short delay
    }
    // --- 👆 [수정 끝] ---
    // For interactive nodes, the flow stops here, waiting for user input (handled by click handlers)

  // <<< [수정] 의존성 배열에서 proceedToNextNode 제거, nodes, edges, setSlots, handleApiNode, handleLlmNode 추가 >>>
  }, [nodes, edges, setSlots, handleApiNode, handleLlmNode, proceedToNextNode]);

  // Update the ref whenever addBotMessage function changes
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
      // Use the ref to call the latest addBotMessage
      if (addBotMessageRef.current) {
          addBotMessageRef.current(effectiveStartNodeId, {});
      }
    } else {
        console.warn("No start node found for simulation.");
        setIsStarted(false);
    }
  }, [nodes, edges, setSlots, startNodeId]); // addBotMessage 제거

  useEffect(() => {
    setIsStarted(false);
    setHistory([]);
  }, [nodes, edges]);

  // Removed the auto-proceed useEffect block as auto-proceeding is now handled within addBotMessage

  return {
    history, setHistory, currentId, currentNode, fixedMenu, isStarted, startSimulation, proceedToNextNode
  };
};