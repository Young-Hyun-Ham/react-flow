// src/hooks/useChatFlow.js

import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store';
import { interpolateMessage, getNestedValue, evaluateCondition } from '../simulatorUtils';

export const useChatFlow = (nodes, edges) => {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fixedMenu, setFixedMenu] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const { slots, setSlots, anchorNodeId, startNodeId } = useStore();
  const currentNode = nodes.find(n => n.id === currentId);

  // useRef for addBotMessage to break circular dependency in useCallback
  const addBotMessageRef = useRef(null);

  // Define proceedToNextNode first
  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots) => {
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
             setTimeout(() => addBotMessageRef.current(nextNode.id, updatedSlots), 500); // Delay might help rendering updates
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
  // Dependencies for proceedToNextNode
  }, [edges, nodes, anchorNodeId]); // Removed addBotMessageRef from here

  // Define handleApiNode
  const handleApiNode = useCallback(async (node, currentSlots) => {
    const loadingId = Date.now();
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
                const interpolatedBodyString = JSON.stringify(JSON.parse(rawBody), (key, value) => {
                    if (typeof value === 'string') {
                        return interpolateMessage(value, currentSlots);
                    }
                    return value;
                });
                 finalBody = interpolatedBodyString;
             } catch (e) {
                 console.error("Error processing API body:", e);
                 throw new Error(`Invalid JSON body format: ${e.message}`);
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
        setHistory(prev => prev.filter(item => item.id !== loadingId));
        proceedToNextNode('onSuccess', node.id, finalSlots); // Call proceedToNextNode directly
    } catch (error) {
        console.error("API Error:", error);
        setHistory(prev => prev.filter(item => item.id !== loadingId));
        setHistory(prev => [...prev, { type: 'bot', message: `API Error: ${error.message}`, id: loadingId }]);
        proceedToNextNode('onError', node.id, finalSlots); // Call proceedToNextNode directly
    }
  // --- 👇 [수정] proceedToNextNode 제거 ---
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]); // Remove proceedToNextNode if causing issues, but it seems necessary here. Let's keep it for now and see if order fixes it.

  // Define handleLlmNode
  const handleLlmNode = useCallback(async (node, currentSlots) => {
    const streamingMessageId = Date.now();
    let accumulatedContent = '';
    setHistory(prev => [...prev, { type: 'bot_streaming', id: streamingMessageId, content: '', isStreaming: true }]);

    try {
        const interpolatedPrompt = interpolateMessage(node.data.prompt, currentSlots);
        const response = await fetch('https://musclecat.co.kr/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: interpolatedPrompt
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
                         try {
                           const jsonData = JSON.parse(jsonString);
                           const contentChunk = jsonData.choices?.[0]?.delta?.content || jsonData.text || '';
                           if (contentChunk) {
                               accumulatedContent += contentChunk;
                               setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent } : item));
                           }
                         } catch (parseError) {
                            if (line.trim()) {
                                accumulatedContent += line + "\n";
                                setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent } : item));
                            }
                         }
                     } else if (line.trim()) {
                        accumulatedContent += line + "\n";
                        setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent } : item));
                     }
                 }
             } catch (e) {
                 console.error("Error processing LLM stream chunk:", e, "Chunk:", value);
                 accumulatedContent += `\n[Error processing stream: ${e.message}]`;
                 setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent } : item));
                 break;
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
        proceedToNextNode(null, node.id, finalSlots); // Call proceedToNextNode directly
    }
  // --- 👇 [수정] proceedToNextNode 제거 ---
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]); // Remove proceedToNextNode if causing issues, same logic as handleApiNode.

  // Define addBotMessage AFTER proceedToNextNode, handleApiNode, handleLlmNode
  const addBotMessage = useCallback((nodeId, updatedSlots) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Handle specific node types
    if (node.type === 'start') {
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
    }
    if (node.type === 'scenario') {
      const childNodes = nodes.filter(n => n.parentNode === node.id);
      const childNodeIds = new Set(childNodes.map(n => n.id));
      // Find the start node within the group (node with no incoming edges *from within the group*)
      const startNode = childNodes.find(n =>
        !edges.some(e => e.target === n.id && childNodeIds.has(e.source))
      );
      if (startNode) {
        setCurrentId(startNode.id);
        addBotMessage(startNode.id, updatedSlots); // Direct recursive call
      } else {
        // If no start node found (e.g., empty group), proceed from the group node itself
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
                    // Attempt to parse JSON/Boolean/Number, otherwise keep as string
                    const trimmedValue = interpolatedValue.trim();
                    if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) || (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
                        newSlots[assignment.key] = JSON.parse(trimmedValue);
                    } else if (trimmedValue.toLowerCase() === 'true') {
                        newSlots[assignment.key] = true;
                    } else if (trimmedValue.toLowerCase() === 'false') {
                        newSlots[assignment.key] = false;
                    } else if (!isNaN(trimmedValue) && trimmedValue !== '') {
                         // Check if it's actually numeric, not just parsable as NaN
                         const num = Number(trimmedValue);
                         if (!isNaN(num)) newSlots[assignment.key] = num;
                         else newSlots[assignment.key] = interpolatedValue; // Keep as string if parsing results in NaN but wasn't empty
                    } else {
                        newSlots[assignment.key] = interpolatedValue; // Keep as string
                    }
                } catch (e) {
                    newSlots[assignment.key] = interpolatedValue; // Fallback to string if JSON parsing fails
                }
            }
        });
        setSlots(newSlots); // Update global state
        proceedToNextNode(null, nodeId, newSlots); // Proceed with updated slots
        return;
    }
    // Handle Form node - set initial values from defaults/slots
    if (node.type === 'form') {
      let initialSlotsUpdate = {};
      (node.data.elements || []).forEach(element => {
        // Only process inputs with a name and a defined default value
        if (element.type === 'input' && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
          const defaultValueConfig = element.defaultValue;
          // Interpolate default value using current slots
          let resolvedValue = interpolateMessage(String(defaultValueConfig), updatedSlots);
          if (resolvedValue !== undefined) {
             initialSlotsUpdate[element.name] = resolvedValue;
          }
        } else if ((element.type === 'date' || element.type === 'dropbox') && element.name && element.defaultValue !== undefined && element.defaultValue !== '') {
            // Interpolate default value for date/dropbox (if needed)
             initialSlotsUpdate[element.name] = interpolateMessage(String(element.defaultValue), updatedSlots);
        } else if (element.type === 'checkbox' && element.name && Array.isArray(element.defaultValue)) {
             // Checkbox default value is an array, no interpolation needed
              initialSlotsUpdate[element.name] = element.defaultValue;
        }
        // Grid default values are handled differently (usually structure, not single value)
      });

      // Combine current slots with newly resolved default values
      const finalSlotsForForm = { ...updatedSlots, ...initialSlotsUpdate };
      if (Object.keys(initialSlotsUpdate).length > 0) {
        setSlots(finalSlotsForForm); // Update global state if defaults were applied
      }

      // Add the form message to history, indicating it's waiting for input
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: false, id: Date.now() }]);
      // Don't proceed automatically, wait for user submission
      return;
    }
    // Handle specific non-proceeding or special nodes
    if (node.type === 'fixedmenu') {
      // Reset history and set the fixed menu
      setHistory([]);
      setFixedMenu({ nodeId: node.id, ...node.data });
      setCurrentId(node.id); // Stay on the fixed menu node
      return; // Don't proceed
    }
    if (node.type === 'link') {
      const url = interpolateMessage(node.data.content, updatedSlots);
      const display = interpolateMessage(node.data.display, updatedSlots);
      // Add link info to history
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: true, id: Date.now(), linkData: { url, display } }]);
      // Open link in a new tab
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
      // Proceed immediately after showing/opening the link
      proceedToNextNode(null, nodeId, updatedSlots);
      return;
    }
     if (node.type === 'toast') {
        const message = interpolateMessage(node.data.message, updatedSlots);
        alert(`[${node.data.toastType || 'info'}] ${message}`); // Show toast (using alert for simplicity)
        proceedToNextNode(null, nodeId, updatedSlots); // Proceed immediately
        return;
    }
    // Branch node with CONDITION type - evaluate conditions and proceed
     if (node.type === 'branch' && node.data.evaluationType === 'CONDITION') {
        proceedToNextNode(null, nodeId, updatedSlots); // Let proceedToNextNode handle condition evaluation
        return;
    }

    // Determine if the node requires user interaction
    const isInteractive = (node.type === 'branch' && node.data.evaluationType === 'BUTTON' && node.data.replies?.length > 0) || node.type === 'slotfilling';
    // Add message to history (except for form, which was added earlier)
    if (node.type !== 'form') {
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: !isInteractive || node.type === 'iframe', id: Date.now() }]);
    }
    // Automatically proceed if the node is not interactive and not a fixed menu
    if (!isInteractive && node.type !== 'fixedmenu') { // Already handled form above
        // Use setTimeout to allow state updates to render before proceeding
        setTimeout(() => proceedToNextNode(null, nodeId, updatedSlots), 100);
    }
    // If interactive (slotfilling, branch with buttons), wait for user input (do nothing here)

  // Dependencies for addBotMessage
  }, [nodes, edges, setSlots, handleApiNode, handleLlmNode, proceedToNextNode]);

  // Effect to update the ref whenever addBotMessage function definition changes
  useEffect(() => {
    addBotMessageRef.current = addBotMessage;
  }, [addBotMessage]);

  // startSimulation definition (no changes needed)
  const startSimulation = useCallback(() => {
    setIsStarted(true);
    let effectiveStartNodeId = startNodeId;
    // Find start node if not explicitly set
    if (!effectiveStartNodeId) {
      let startNode = nodes.find(n => n.type === 'start');
      if (!startNode) { // Fallback to node with no incoming edges
          startNode = nodes.find(n => !edges.some(e => e.target === n.id) && !n.parentNode);
      }
      effectiveStartNodeId = startNode?.id;
    }
    // Initialize state and start flow if start node found
    if (effectiveStartNodeId) {
      setSlots({});
      setFixedMenu(null);
      setHistory([]);
      setCurrentId(effectiveStartNodeId);
      if (addBotMessageRef.current) {
          addBotMessageRef.current(effectiveStartNodeId, {}); // Start flow from the beginning
      }
    } else {
        console.warn("No start node found for simulation.");
        setIsStarted(false); // Can't start if no start node
    }
  }, [nodes, edges, setSlots, startNodeId]);

  // Effect to reset simulation state when nodes/edges change (no changes needed)
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