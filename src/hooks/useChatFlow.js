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

  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots) => {
    // ... (proceedToNextNode logic - LLM 관련 딜레이 제거됨) ...
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
             // LLM 노드 다음에는 즉시 진행하도록 딜레이 제거
             addBotMessageRef.current(nextNode.id, updatedSlots);
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
             proceedToNextNode(parentEdge.sourceHandle, sourceNode.parentNode, updatedSlots);
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

  const handleApiNode = useCallback(async (node, currentSlots) => {
    const loadingId = generateUniqueId(); // 고유 ID 사용
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
                 try { JSON.parse(finalBody); } catch(e) { console.warn("API body is not valid JSON after interpolation:", finalBody); }
             } catch (e) {
                 console.error("Error processing API body string:", e);
                 throw new Error(`Invalid body format or interpolation error: ${e.message}`);
             }

            return fetch(interpolatedUrl, { /* ... fetch options ... */ }).then(async res => { /* ... response handling ... */ });
        };

        const promises = isMulti ? (apis || []).map(processApiCall) : [processApiCall(node.data)];
        const results = await Promise.allSettled(promises);

        const failedCalls = results.filter(r => r.status === 'rejected');
        if (failedCalls.length > 0) {
             throw new Error(failedCalls[0].reason.message || `API call '${failedCalls[0].reason.apiName || 'Unnamed'}' failed.`);
        }

        const newSlots = {};
        results.forEach(res => { /* ... mapping logic ... */ });

        finalSlots = { ...currentSlots, ...newSlots };
        setSlots(finalSlots);
        setHistory(prev => prev.filter(item => item.id !== loadingId));
        proceedToNextNode('onSuccess', node.id, finalSlots);
    } catch (error) {
        console.error("API Error:", error);
        setHistory(prev => prev.filter(item => item.id !== loadingId));
        setHistory(prev => [...prev, { type: 'bot', message: `API Error: ${error.message}`, id: generateUniqueId() }]); // 고유 ID 사용
        proceedToNextNode('onError', node.id, finalSlots);
    }
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]);

  // Define handleLlmNode - Removed history updates for LLM response
  const handleLlmNode = useCallback(async (node, currentSlots) => {
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key (VITE_GEMINI_API_KEY) is not set.");
      setHistory(prev => [...prev, { type: 'bot', message: "LLM Error: API key not configured.", id: generateUniqueId() }]); // 고유 ID 사용
      proceedToNextNode(null, node.id, currentSlots);
      return;
    }

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
      setHistory(prev => [...prev, { type: 'bot', message: accumulatedContent, id: generateUniqueId() }]); // 고유 ID 사용
    } finally {
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
      proceedToNextNode(null, node.id, finalSlots);
    }
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]); // proceedToNextNode 의존성 유지

  // Define addBotMessage AFTER proceedToNextNode, handleApiNode, handleLlmNode
  const addBotMessage = useCallback((nodeId, updatedSlots) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // LLM 노드는 히스토리에 추가하지 않고 바로 handleLlmNode 호출 후 종료
    if (node.type === 'llm') {
      handleLlmNode(node, updatedSlots);
      return;
    }

    // Handle other specific node types (start, scenario, api, setSlot, delay)
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
        addBotMessage(startNode.id, updatedSlots);
      } else {
        proceedToNextNode(null, node.id, updatedSlots);
      }
      return;
    }
    if (node.type === 'api') {
      handleApiNode(node, updatedSlots);
      return;
    }
     if (node.type === 'setSlot') {
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
        proceedToNextNode(null, nodeId, newSlots);
        return;
    }
    if (node.type === 'delay') {
        const duration = node.data.duration || 0;
        setTimeout(() => {
            proceedToNextNode(null, nodeId, updatedSlots);
        }, duration);
        return;
    }

    // Handle nodes that *might* add to history (Form, Link, Toast, Branch, Message, SlotFilling, iFrame)
    let shouldAddToHistory = true;
    let isImmediatelyCompleted = true;
    let linkData = null; // 링크 데이터 초기화

    // Form node Handling
    if (node.type === 'form') {
       let initialSlotsUpdate = {};
      (node.data.elements || []).forEach(element => {
        // ... (form 초기값 설정 로직) ...
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
      isImmediatelyCompleted = false;
    }
    // FixedMenu Node Handling
    if (node.type === 'fixedmenu') {
      setHistory([]);
      setFixedMenu({ nodeId: node.id, ...node.data });
      setCurrentId(node.id);
      shouldAddToHistory = false;
      isImmediatelyCompleted = false;
    }
    // Link Node Handling
    if (node.type === 'link') {
      const url = interpolateMessage(node.data.content, updatedSlots);
      const display = interpolateMessage(node.data.display, updatedSlots);
      linkData = { url, display }; // linkData 설정
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
      isImmediatelyCompleted = true; // Link는 즉시 완료됨
      // proceedToNextNode는 히스토리 추가 후 호출됨
    }
     // Toast Node Handling
     if (node.type === 'toast') {
        const message = interpolateMessage(node.data.message, updatedSlots);
        alert(`[${node.data.toastType || 'info'}] ${message}`);
        shouldAddToHistory = false;
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
    }
    // Conditional Branch Node Handling
     if (node.type === 'branch' && node.data.evaluationType === 'CONDITION') {
        shouldAddToHistory = false;
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
    }

    // Determine interactivity for remaining types
    const isInteractive = (node.type === 'branch' && node.data.evaluationType === 'BUTTON' && node.data.replies?.length > 0) || node.type === 'slotfilling';
    if (isInteractive) {
        isImmediatelyCompleted = false;
    }
    if (node.type === 'iframe') {
        isImmediatelyCompleted = true;
    }

    // Add message to history if needed
    if (shouldAddToHistory) {
      const newItem = {
          type: 'bot',
          nodeId,
          isCompleted: isImmediatelyCompleted,
          id: generateUniqueId(), // 고유 ID 사용
          ...(linkData && { linkData }) // linkData가 있으면 추가
      };
      setHistory(prev => [...prev, newItem]);
    }

    // Automatically proceed if immediately completed
    if (isImmediatelyCompleted && node.type !== 'fixedmenu') {
        proceedToNextNode(null, nodeId, updatedSlots);
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
          addBotMessageRef.current(effectiveStartNodeId, {});
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