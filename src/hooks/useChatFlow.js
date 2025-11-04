// src/hooks/useChatFlow.js

// ========================================================================
// == Chatbot Scenario Execution Reference Implementation ==
// This hook defines the standard logic for executing chatbot scenarios
// based on the defined node and edge structures. The actual chatbot engine
// should aim to replicate this behavior as closely as possible.
// ========================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store';
import { interpolateMessage, getNestedValue, evaluateCondition } from '../simulatorUtils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- 👇 [추가] 고유 ID 생성을 위한 함수 ---
const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
// --- 👆 [추가 끝] ---


export const useChatFlow = (nodes, edges) => {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fixedMenu, setFixedMenu] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const { slots, setSlots, anchorNodeId, startNodeId } = useStore();
  const currentNode = nodes.find(n => n.id === currentId);

  const addBotMessageRef = useRef(null);

  // --- 👇 [수정] activeChainId 인자 추가 ---
  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots, activeChainId = null) => {
    // ... (proceedToNextNode 로직 - 변경 없음) ...
    if (sourceNodeId === anchorNodeId) {
        setCurrentId(null);
        return;
    }
    if (!sourceNodeId) return;
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    let nextEdge;
    // LLM condition check
    if (sourceNode && sourceNode.type === 'llm' && sourceNode.data.conditions?.length > 0) {
        const llmOutput = updatedSlots[sourceNode.data.outputVar] || '';
        const matchedCondition = sourceNode.data.conditions.find(cond =>
            llmOutput.toLowerCase().includes(cond.keyword.toLowerCase())
        );
        if (matchedCondition) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === matchedCondition.id);
        }
    }
    // Branch condition check
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
         if (!nextEdge) { // Check for default edge if no condition matched
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === 'default');
         }
    }
    // Find next edge based on handle or default
    if (!nextEdge) {
        if (sourceHandleId) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId);
        } else {
            // Prefer default handle first, then handle without ID
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === 'default') ||
                       edges.find(edge => edge.source === sourceNodeId && !edge.sourceHandle);
        }
    }
    // Process the next edge
    if (nextEdge) {
      const nextNode = nodes.find(node => node.id === nextEdge.target);
      if (nextNode) {
        setCurrentId(nextNode.id);
        // Use the ref to call the latest addBotMessage asynchronously
        if (addBotMessageRef.current) {
             // --- 👇 [수정] 딜레이 로직을 addBotMessage로 이동시킴 ---
             addBotMessageRef.current(nextNode.id, updatedSlots, activeChainId);
        }
      } else {
         console.warn(`Next node with id ${nextEdge.target} not found.`);
         setCurrentId(null); // Stop flow if next node doesn't exist
      }
    } else {
      // Handle cases where there's no outgoing edge (e.g., end of flow, node inside a group)
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      // If the node is inside a group, try to find an edge from the parent group node
      if (sourceNode?.parentNode) {
         const parentEdge = edges.find(edge => edge.source === sourceNode.parentNode);
         if (parentEdge) {
             // Recursively call proceedToNextNode for the parent node
            // --- 👇 [수정] activeChainId 인자 전달 ---
             proceedToNextNode(parentEdge.sourceHandle, sourceNode.parentNode, updatedSlots, activeChainId);
         } else {
            setCurrentId(null); // Stop flow if parent has no outgoing edge
         }
        return; // Important: exit after handling parent node
      }
      // Stop flow if it's not an interactive node waiting for input
      if(sourceNode?.type !== 'fixedmenu' && sourceNode?.type !== 'form' && sourceNode?.type !== 'slotfilling' && !(sourceNode?.type === 'branch' && sourceNode.data.evaluationType === 'BUTTON')) {
        setTimeout(() => setCurrentId(null), 500); // Use timeout to ensure state updates settle
      }
    }
  }, [edges, nodes, anchorNodeId]); // addBotMessageRef 제거

  // --- 👇 [수정] activeChainId 인자 추가 ---
  const handleApiNode = useCallback(async (node, currentSlots, activeChainId = null) => {
    const loadingId = generateUniqueId(); // 고유 ID 사용
    // --- 👇 [수정] API 로딩은 chainNext와 상관없이 항상 즉시 표시 ---
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
    let finalSlots = { ...currentSlots };
    try {
        const { isMulti, apis } = node.data;

        const processApiCall = (apiCall) => {
            const interpolatedUrl = interpolateMessage(apiCall.url, currentSlots);
            const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', currentSlots));

            const rawBody = apiCall.body || '{}';
            let finalBody;
             try {
                const interpolatedBodyString = interpolateMessage(rawBody, currentSlots);
                finalBody = interpolatedBodyString;
                 try {
                     JSON.parse(finalBody); // Validate if it's still JSON
                 } catch(e) {
                      console.warn("API body is not valid JSON after interpolation:", finalBody);
                 }
             } catch (e) {
                 console.error("Error processing API body string:", e);
                 throw new Error(`Invalid body format or interpolation error: ${e.message}`);
             }

            return fetch(interpolatedUrl, {
                method: apiCall.method,
                headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
                body: apiCall.method !== 'GET' && apiCall.method !== 'HEAD' ? finalBody : undefined,
            }).then(async res => {
                const resBody = await res.json().catch(() => null);
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
        setHistory(prev => prev.filter(item => item.id !== loadingId)); // 로딩 제거
        // --- 👇 [수정] activeChainId 인자 전달 ---
        proceedToNextNode('onSuccess', node.id, finalSlots, activeChainId);
    } catch (error) {
        console.error("API Error:", error);
        setHistory(prev => prev.filter(item => item.id !== loadingId)); // 로딩 제거
        // --- 👇 [수정] API 에러는 chainNext와 상관없이 항상 즉시 표시 ---
        setHistory(prev => [...prev, { type: 'bot', message: `API Error: ${error.message}`, id: generateUniqueId() }]); // 고유 ID 사용
        // --- 👇 [수정] activeChainId 인자 전달 (에러시 체인 중단) ---
        proceedToNextNode('onError', node.id, finalSlots, null); // 에러 발생 시 체인 중단
    }
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]);

  // --- 👇 [수정] activeChainId 인자 추가 ---
  const handleLlmNode = useCallback(async (node, currentSlots, activeChainId = null) => {
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key (VITE_GEMINI_API_KEY) is not set.");
      // --- 👇 [수정] LLM 에러는 chainNext와 상관없이 항상 즉시 표시 ---
      setHistory(prev => [...prev, { type: 'bot', message: "LLM Error: API key not configured.", id: generateUniqueId() }]); // 고유 ID 사용
      // --- 👇 [수정] activeChainId 인자 전달 (에러시 체인 중단) ---
      proceedToNextNode(null, node.id, currentSlots, null); // 에러 발생 시 체인 중단
      return;
    }

    // --- 👇 [수정] LLM 로딩 표시 ---
    const loadingId = generateUniqueId();
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
    let accumulatedContent = '';
    // 히스토리 추가 제거됨

    try {
      const interpolatedPrompt = interpolateMessage(node.data.prompt, currentSlots);
      // 모델 버전 gemini-2.0-flash 로 고정
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: interpolatedPrompt }] }],
          // generationConfig: { ... }
        }),
      });

      console.log("LLM Response Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`LLM API Error ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
      }
      if (!response.body) throw new Error('ReadableStream not available');

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      console.log("Starting to read stream...");

      while (true) {
        const { value, done } = await reader.read();
        // console.log("Reader Read:", { value: value ? value.substring(0, 100) + '...' : value, done });

        if (value) {
            buffer += value;
        }

        let boundaryIndex;
        while ((boundaryIndex = buffer.search(/\r?\n\r?\n/)) !== -1) {
          const message = buffer.substring(0, boundaryIndex);
          const boundaryLength = buffer.substring(boundaryIndex).startsWith('\r\n\r\n') ? 4 : 2;
          buffer = buffer.substring(boundaryIndex + boundaryLength);

          if (message.startsWith('data: ')) {
            const jsonString = message.substring(6).replace(/\r/g, '').trim();
            if (jsonString) {
              try {
                const jsonData = JSON.parse(jsonString);
                // console.log("Attempting to extract text from:", JSON.stringify(jsonData, null, 2));
                const contentChunk = jsonData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                // console.log(`Extracted Chunk: "${contentChunk}" (Type: ${typeof contentChunk})`);

                if (contentChunk) {
                  accumulatedContent += contentChunk;
                  // 히스토리 업데이트 제거됨
                  // console.log("Accumulated content NOW:", accumulatedContent);
                } else {
                   // console.log("contentChunk extraction failed or resulted in empty string.");
                }
              } catch (parseError) {
                console.error("Error parsing LLM stream chunk:", parseError, "Original Message:", message);
              }
            } else {
                 // console.log("Skipping empty jsonString after 'data: '.");
            }
          } else if (message.trim()) {
              console.log("Received non-data message:", message);
          } else {
              // console.log("Skipping message not starting with 'data: ':", message);
          }
        } // 내부 while 종료

        if (done) {
          console.log("Stream finished.");
          break;
        }
      } // 외부 while 종료
    } catch (error) {
       console.error("LLM Error:", error);
      accumulatedContent = `LLM Error: ${error.message}`;
      // 에러 시 히스토리 추가
      // --- 👇 [수정] LLM 에러는 chainNext와 상관없이 항상 즉시 표시 ---
      setHistory(prev => [...prev, { type: 'bot', message: accumulatedContent, id: generateUniqueId() }]); // 고유 ID 사용
    } finally {
      // --- 👇 [수정] LLM 로딩 제거 ---
      setHistory(prev => prev.filter(item => item.id !== loadingId));
      console.log("Finally block reached. Final accumulated content:", accumulatedContent);
      // 히스토리 업데이트 제거됨

      let finalSlots = { ...currentSlots };
      if (node.data.outputVar && !accumulatedContent.startsWith('LLM Error:')) {
        finalSlots[node.data.outputVar] = accumulatedContent;
        setSlots(finalSlots);
        console.log(`LLM Response stored in slot '${node.data.outputVar}'.`);
      } else if (node.data.outputVar) {
        console.log(`LLM Error occurred, not storing in slot '${node.data.outputVar}'.`);
      }
      // LLM 노드는 사용자에게 보여지는 부분이 없으므로 바로 다음 노드로 진행
      // --- 👇 [수정] activeChainId 인자 전달 (에러시 체인 중단) ---
      const nextChainId = accumulatedContent.startsWith('LLM Error:') ? null : activeChainId;
      proceedToNextNode(null, node.id, finalSlots, nextChainId);
    }
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]); // proceedToNextNode 의존성 유지

  // --- 👇 [수정] activeChainId 인자 추가 및 딜레이/체인 로직 구현 ---
  const addBotMessage = useCallback((nodeId, updatedSlots, activeChainId = null) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // 1. 'delay' 노드: 딜레이 후 다음 노드 진행
    if (node.type === 'delay') {
        const duration = node.data.duration || 0;
        setTimeout(() => {
            proceedToNextNode(null, nodeId, updatedSlots, activeChainId);
        }, duration);
        return;
    }

    // 2. '보이지 않는' 노드 (start, setSlot, branch(condition), toast)
    //    로직 즉시 실행 후, 딜레이 없이 다음 노드 진행
    if (
      node.type === 'start' || 
      node.type === 'setSlot' || 
      (node.type === 'branch' && node.data.evaluationType === 'CONDITION') ||
      node.type === 'toast'
    ) {
      let finalSlots = { ...updatedSlots };
      if (node.type === 'setSlot') {
          // ... (setSlot 로직) ...
        const newSlots = { ...updatedSlots };
        node.data.assignments?.forEach(assignment => {
            if (assignment.key) {
                const interpolatedValue = interpolateMessage(assignment.value, updatedSlots);
                try {
                    const trimmedValue = interpolatedValue.trim();
                    if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) || (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
                        newSlots[assignment.key] = JSON.parse(trimmedValue);
                    } else if (trimmedValue.toLowerCase() === 'true') {
                        newSlots[assignment.key] = true;
                    } else if (trimmedValue.toLowerCase() === 'false') {
                        newSlots[assignment.key] = false;
                    } else if (!isNaN(trimmedValue) && trimmedValue !== '') {
                         const num = Number(trimmedValue);
                         if (!isNaN(num)) newSlots[assignment.key] = num;
                         else newSlots[assignment.key] = interpolatedValue;
                    } else {
                        newSlots[assignment.key] = interpolatedValue;
                    }
                } catch (e) {
                    newSlots[assignment.key] = interpolatedValue;
                }
            }
        });
        setSlots(newSlots);
        finalSlots = newSlots;
      }
      if (node.type === 'toast') {
        const message = interpolateMessage(node.data.message, updatedSlots);
        alert(`[${node.data.toastType || 'info'}] ${message}`);
      }
        proceedToNextNode(null, nodeId, finalSlots, activeChainId);
        return;
    }

    // 3. '비동기' 노드 (api, llm, scenario)
    //    로딩 표시 후, 비동기 함수 호출 (비동기 함수가 알아서 proceedToNextNode 호출)
    if (node.type === 'api') {
      handleApiNode(node, updatedSlots, activeChainId);
      return;
    }
    if (node.type === 'llm') {
      handleLlmNode(node, updatedSlots, activeChainId);
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
        addBotMessage(startNode.id, updatedSlots, activeChainId);
      } else {
        proceedToNextNode(null, node.id, updatedSlots, activeChainId);
      }
      return;
    }

    // 4. '보이는' 노드 (message, form, link, iframe, slotfilling, branch(button), fixedmenu)
    //    체인 로직을 적용하여 history에 추가/병합
    const nodeDataPacket = {
        type: node.type,
        nodeId: node.id,
        data: node.data,
    };

    if (node.type === 'link') {
      const url = interpolateMessage(node.data.content, updatedSlots);
      const display = interpolateMessage(node.data.display, updatedSlots);
      nodeDataPacket.linkData = { url, display }; // linkData 설정
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
    }

    const isInteractive = (node.type === 'form') ||
                         (node.type === 'slotfilling') ||
                         (node.type === 'branch' && node.data.evaluationType === 'BUTTON') ||
                         (node.type === 'fixedmenu');
    
    // 다음 노드와 연결(chain)할지 여부
    const isChaining = node.data.chainNext === true && !isInteractive;

    if (node.type === 'fixedmenu') {
        setHistory([]); // 새 메시지이므로 히스토리 초기화
        setFixedMenu({ nodeId: node.id, ...node.data });
        setCurrentId(node.id);
        // fixedmenu는 history에 추가하거나 proceed하지 않음
        return; 
    }

    if (!activeChainId) {
        // --- A. 새 체인 시작 ---
        const newChainId = generateUniqueId();
        const newItem = {
            type: 'bot',
            id: newChainId, // 새 말풍선 ID
            combinedData: [nodeDataPacket], // 이 노드를 첫 번째 멤버로 추가
            isCompleted: !isInteractive,
            isChaining: isChaining // (의미 없음, 다음 노드 판단용)
        };
        setHistory(prev => [...prev, newItem]);
        
        if (!isInteractive) {
            // 500ms 딜레이 후 다음 노드로 진행
            setTimeout(() => {
                proceedToNextNode(null, nodeId, updatedSlots, isChaining ? newChainId : null);
            }, 500);
        } else {
            // (Form 노드 초기값 설정 로직)
            if (node.type === 'form') {
                let initialSlotsUpdate = {};
                (node.data.elements || []).forEach(element => {
                    if (element.type === 'input' && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
                        const defaultValueConfig = element.defaultValue;
                        let resolvedValue = interpolateMessage(String(defaultValueConfig), updatedSlots);
                        if (resolvedValue !== undefined) {
                            initialSlotsUpdate[element.name] = resolvedValue;
                        }
                    } else if ((element.type === 'date' || element.type === 'dropbox') && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
                        initialSlotsUpdate[element.name] = interpolateMessage(String(element.defaultValue), updatedSlots);
                    } else if (element.type === 'checkbox' && element.name && Array.isArray(element.defaultValue)) {
                        initialSlotsUpdate[element.name] = element.defaultValue;
                    }
                });
                const finalSlotsForForm = { ...updatedSlots, ...initialSlotsUpdate };
                if (Object.keys(initialSlotsUpdate).length > 0) {
                    setSlots(finalSlotsForForm);
                }
            }
        }
    } else {
        // --- B. 기존 체인에 덧붙이기 ---
        setHistory(prev => prev.map(item => 
            item.id === activeChainId 
            ? { 
                ...item, 
                combinedData: [...item.combinedData, nodeDataPacket], // 현재 노드 덧붙이기
                isCompleted: !isInteractive, // 갱신
                isChaining: isChaining      // (의미 없음, 다음 노드 판단용)
              } 
            : item
        ));

        if (!isInteractive) {
             // 500ms 딜레이 후 다음 노드로 진행
            setTimeout(() => {
                proceedToNextNode(null, nodeId, updatedSlots, isChaining ? activeChainId : null);
            }, 500);
        } else {
             // (Form 노드 초기값 설정 로직)
            if (node.type === 'form') {
                let initialSlotsUpdate = {};
                (node.data.elements || []).forEach(element => {
                    if (element.type === 'input' && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
                        const defaultValueConfig = element.defaultValue;
                        let resolvedValue = interpolateMessage(String(defaultValueConfig), updatedSlots);
                        if (resolvedValue !== undefined) {
                            initialSlotsUpdate[element.name] = resolvedValue;
                        }
                    } else if ((element.type === 'date' || element.type === 'dropbox') && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
                        initialSlotsUpdate[element.name] = interpolateMessage(String(element.defaultValue), updatedSlots);
                    } else if (element.type === 'checkbox' && element.name && Array.isArray(element.defaultValue)) {
                        initialSlotsUpdate[element.name] = element.defaultValue;
                    }
                });
                const finalSlotsForForm = { ...updatedSlots, ...initialSlotsUpdate };
                if (Object.keys(initialSlotsUpdate).length > 0) {
                    setSlots(finalSlotsForForm);
                }
            }
        }
    }

  }, [nodes, edges, setSlots, handleApiNode, handleLlmNode, proceedToNextNode]); // Ensure proceedToNextNode is included

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
        // --- 👇 [수정] 체인 시작 (null 전달) ---
          addBotMessageRef.current(effectiveStartNodeId, {}, null);
      }
    } else {
        console.warn("No start node found for simulation.");
        setIsStarted(false);
    }
  }, [nodes, edges, setSlots, startNodeId]);

  useEffect(() => {
     setIsStarted(false);
    setHistory([]);
    setCurrentId(null);
    setFixedMenu(null);
  }, [nodes, edges]);

  return {
    history, setHistory, currentId, currentNode, fixedMenu, isStarted, startSimulation, proceedToNextNode
  };
};