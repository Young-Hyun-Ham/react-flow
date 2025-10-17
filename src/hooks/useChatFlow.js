import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store';
import { interpolateMessage, interpolateMessageForApi, getNestedValue, evaluateCondition } from '../simulatorUtils';

export const useChatFlow = (nodes, edges) => {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fixedMenu, setFixedMenu] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const { slots, setSlots, anchorNodeId } = useStore();
  const currentNode = nodes.find(n => n.id === currentId);

  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots) => {
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
            const slotValue = updatedSlots[condition.slot];
            if (evaluateCondition(slotValue, condition.operator, condition, updatedSlots)) {
                const handleId = sourceNode.data.replies[conditions.indexOf(condition)]?.value;
                if(handleId) {
                  nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === handleId);
                  if (nextEdge) break;
                }
            }
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
        setTimeout(() => addBotMessage(nextNode.id, updatedSlots), 500);
      }
    } else {
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      if (sourceNode?.parentNode) {
        proceedToNextNode(null, sourceNode.parentNode, updatedSlots);
        return;
      }
      if(sourceNode?.type !== 'fixedmenu' && sourceNode?.type !== 'branch' && sourceNode?.type !== 'api') {
        setTimeout(() => setCurrentId(null), 500);
      }
    }
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
                    if ((interpolatedValue.startsWith('{') && interpolatedValue.endsWith('}')) || (interpolatedValue.startsWith('[') && interpolatedValue.endsWith(']'))) {
                        newSlots[assignment.key] = JSON.parse(interpolatedValue);
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
    if (node.type === 'fixedmenu') {
      setHistory([]);
      setFixedMenu({ nodeId: node.id, ...node.data });
      setCurrentId(node.id);
      return;
    }
    if (node.type === 'link') {
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: true, id: Date.now() }]);
      if (node.data.content) {
          window.open(node.data.content, '_blank', 'noopener,noreferrer');
      }
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
    
    const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.evaluationType === 'BUTTON' && node.data.replies?.length > 0) || node.type === 'slotfilling';
    setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: !isInteractive || node.type === 'iframe', id: Date.now() }]);
  }, [nodes, edges, proceedToNextNode, setSlots]);

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
            const interpolatedBodyString = JSON.stringify(JSON.parse(rawBody), (key, value) => {
                if (typeof value === 'string') {
                    return value.replace(/{{([^}]+)}}/g, (match, slotKey) => {
                        const slotValue = getNestedValue(currentSlots, slotKey);
                        return typeof slotValue === 'string' ? slotValue : `___SLOT___${slotKey}`;
                    });
                }
                return value;
            });
            
            const finalBody = interpolatedBodyString.replace(/"___SLOT___([^"]+)"/g, (match, slotKey) => {
                const slotValue = getNestedValue(currentSlots, slotKey);
                return JSON.stringify(slotValue);
            });
            
            return fetch(interpolatedUrl, {
                method: apiCall.method,
                headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
                body: apiCall.method !== 'GET' ? finalBody : undefined,
            }).then(res => {
                if (!res.ok) return res.json().then(err => Promise.reject({ status: res.status, body: err, apiName: apiCall.name }));
                return res.json().then(data => ({ data, mapping: apiCall.responseMapping, apiName: apiCall.name }));
            });
        };

        const promises = isMulti ? (apis || []).map(processApiCall) : [processApiCall(node.data)];
        const results = await Promise.allSettled(promises);
      
        const failedCalls = results.filter(r => r.status === 'rejected');
        if (failedCalls.length > 0) throw new Error(`API call '${failedCalls[0].reason.apiName}' failed with status ${failedCalls[0].reason.status}`);
      
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
        setHistory(prev => prev.map(item => item.id === loadingId ? { type: 'bot', message: `All API calls successful.`, id: loadingId } : item));
        proceedToNextNode('onSuccess', node.id, finalSlots);
    } catch (error) {
        console.error("API Error:", error);
        setHistory(prev => prev.map(item => item.id === loadingId ? { type: 'bot', message: `Error: ${error.message}`, id: loadingId } : item));
        proceedToNextNode('onError', node.id, finalSlots);
    }
  }, [proceedToNextNode, setSlots]);

  const handleLlmNode = useCallback(async (node, currentSlots) => {
    const streamingMessageId = Date.now();
    let accumulatedContent = '';
    setHistory(prev => [...prev, { type: 'bot_streaming', id: streamingMessageId, content: '', isStreaming: true }]);
    try {
        const interpolatedPrompt = interpolateMessage(node.data.prompt, currentSlots);
        const response = await fetch('https://musclecat.co.kr/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: interpolatedPrompt }),
        });
        if (!response.body) throw new Error('ReadableStream not available');
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            accumulatedContent += value;
            setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent } : item));
        }
    } catch (error) {
        console.error("LLM Error:", error);
        accumulatedContent = `Error: ${error.message}`;
    } finally {
        setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent, isStreaming: false } : item));
        let finalSlots = { ...currentSlots };
        if (node.data.outputVar) {
            finalSlots[node.data.outputVar] = accumulatedContent;
            setSlots(finalSlots);
        }
        proceedToNextNode(null, node.id, finalSlots);
    }
  }, [proceedToNextNode, setSlots]);
  
  const startSimulation = useCallback((startNodeId) => {
    setIsStarted(true);
    let startNode = startNodeId 
        ? nodes.find(n => n.id === startNodeId) 
        : nodes.find(n => n.type === 'start');
    
    if (!startNode) {
        startNode = nodes.find(n => !edges.some(e => e.target === n.id));
    }

    if (startNode) {
      setSlots({});
      setFixedMenu(null);
      setHistory([]);
      setCurrentId(startNode.id);
      addBotMessage(startNode.id, {});
    }
  }, [nodes, edges, addBotMessage, setSlots]);

  useEffect(() => {
    setIsStarted(false);
    setHistory([]);
  }, [nodes, edges]);

  useEffect(() => {
    if (!isStarted) return;
    const node = nodes.find(n => n.id === currentId);
    if (node && (node.type === 'message' || node.type === 'iframe')) {
      if (currentId === anchorNodeId) {
          setCurrentId(null);
          return;
      }
      const nextEdge = edges.find(edge => edge.source === node.id && !edge.sourceHandle);
      if (nextEdge) {
        const nextNode = nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          const timer = setTimeout(() => {
            setCurrentId(nextNode.id);
            addBotMessage(nextNode.id, slots);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentId, nodes, edges, addBotMessage, slots, isStarted, anchorNodeId]);

  return {
    history, setHistory, currentId, currentNode, fixedMenu, isStarted, startSimulation, proceedToNextNode
  };
};