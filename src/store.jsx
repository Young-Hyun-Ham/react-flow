import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './firebase';
import { createNodeData, createFormElement } from './nodeFactory'; // createFormElement 추가
import * as backendService from './backendService';

const defaultColors = {
  message: '#f39c12',
  form: '#9b59b6',
  branch: '#2ecc71',
  slotfilling: '#3498db',
  api: '#e74c3c',
  fixedmenu: '#e74c3c',
  link: '#34495e',
  llm: '#1abc9c',
  toast: '#95a5a6',
  iframe: '#2c3e50',
  scenario: '#7f8c8d',
  setSlot: '#8e44ad',
};

const defaultTextColors = {
  message: '#ffffff',
  form: '#ffffff',
  branch: '#ffffff',
  slotfilling: '#ffffff',
  api: '#ffffff',
  fixedmenu: '#ffffff',
  link: '#ffffff',
  llm: '#ffffff',
  toast: '#ffffff',
  iframe: '#ffffff',
  scenario: '#ffffff',
  setSlot: '#ffffff',
}

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  anchorNodeId: null,
  startNodeId: null, // <<< [추가] 시작 노드 ID 상태
  nodeColors: defaultColors,
  nodeTextColors: defaultTextColors,
  slots: {},
  selectedRow: null, // <<< [추가] 선택된 행 데이터 상태

  setAnchorNodeId: (nodeId) => {
    set((state) => ({
      anchorNodeId: state.anchorNodeId === nodeId ? null : nodeId,
    }));
  },

  // <<< [추가] 시작 노드 설정 함수 >>>
  setStartNodeId: (nodeId) => {
    set((state) => {
      // 이미 시작 노드이면 null로 설정 (토글 방식)
      if (state.startNodeId === nodeId) {
        return { startNodeId: null };
      }
      return { startNodeId: nodeId };
    });
  },
  // <<< [추가 끝] >>>

  setSelectedRow: (row) => set({ selectedRow: row }), // <<< [추가] selectedRow 업데이트 함수

  setSlots: (newSlots) => set({ slots: newSlots }),

  fetchNodeColors: async () => {
    const docRef = doc(db, "settings", "nodeColors");
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dbColors = docSnap.data();
        set({ nodeColors: { ...defaultColors, ...dbColors } });
      } else {
        await setDoc(docRef, defaultColors);
      }
    } catch (error) {
      console.error("Failed to fetch node colors from DB", error);
    }
  },

  fetchNodeTextColors: async () => {
    const docRef = doc(db, "settings", "nodeTextColors");
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dbTextColors = docSnap.data();
        set({ nodeTextColors: { ...defaultTextColors, ...dbTextColors } });
      } else {
        await setDoc(docRef, defaultTextColors);
      }
    } catch (error) {
      console.error("Failed to fetch node text colors from DB", error);
    }
  },

  setNodeColor: async (type, color) => {
    const newColors = { ...get().nodeColors, [type]: color };
    set({ nodeColors: newColors });
    try {
      const docRef = doc(db, "settings", "nodeColors");
      await setDoc(docRef, newColors);
    } catch (error) {
      console.error("Failed to save node colors to DB", error);
    }
  },

  setNodeTextColor: async (type, color) => {
    const newTextColors = { ...get().nodeTextColors, [type]: color };
    set({ nodeTextColors: newTextColors });
    try {
      const docRef = doc(db, "settings", "nodeTextColors");
      await setDoc(docRef, newTextColors);
    } catch (error) {
      console.error("Failed to save node text colors to DB", error);
    }
  },

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  deleteNode: (nodeId) => {
    set((state) => {
      const nodeToDelete = state.nodes.find(n => n.id === nodeId);
      if (!nodeToDelete) return state;

      let nodesToRemove = [nodeId];
      if (nodeToDelete.type === 'scenario') {
        const childNodes = state.nodes.filter(n => n.parentNode === nodeId);
        childNodes.forEach(child => nodesToRemove.push(child.id));
      }

      const nodesToRemoveSet = new Set(nodesToRemove);
      const remainingNodes = state.nodes.filter(n => !nodesToRemoveSet.has(n.id));
      const remainingEdges = state.edges.filter(e => !nodesToRemoveSet.has(e.source) && !nodesToRemoveSet.has(e.target));

      // <<< [수정] 삭제되는 노드가 시작 노드이면 startNodeId 초기화 >>>
      const newStartNodeId = state.startNodeId === nodeId ? null : state.startNodeId;

      return {
        nodes: remainingNodes,
        edges: remainingEdges,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        startNodeId: newStartNodeId, // <<< [수정]
      };
    });
  },

  toggleScenarioNode: (nodeId) => {
    set((state) => {
      const newNodes = state.nodes.map(n => {
        if (n.id === nodeId && n.type === 'scenario') {
          const isCollapsed = !(n.data.isCollapsed || false);
          let newStyle = { ...n.style };

          if (isCollapsed) {
            newStyle.width = 250;
            newStyle.height = 50;
          } else {
            const PADDING = 40;
            const childNodes = state.nodes.filter(child => child.parentNode === nodeId);
            if (childNodes.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
              childNodes.forEach(node => {
                const x = node.position.x;
                const y = node.position.y;
                const nodeWidth = node.width || 250;
                const nodeHeight = node.height || 150;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + nodeWidth);
                maxY = Math.max(maxY, y + nodeHeight);
              });

              newStyle.width = (maxX - minX) + PADDING * 2;
              newStyle.height = (maxY - minY) + PADDING * 2;

              // Ensure child nodes are repositioned if they are outside the new bounds
              childNodes.forEach(node => {
                node.position.x -= (minX - PADDING);
                node.position.y -= (minY - PADDING);
              });

            } else {
              newStyle.width = 250;
              newStyle.height = 100;
            }
          }

          return {
            ...n,
            style: newStyle,
            data: { ...n.data, isCollapsed },
          };
        }
        return n;
      });
      return { nodes: newNodes };
    });
  },

  deleteSelectedEdges: () => {
    set((state) => ({
      edges: state.edges.filter((edge) => !edge.selected),
    }));
  },

  duplicateNode: (nodeId) => {
    const { nodes } = get();
    const originalNode = nodes.find((node) => node.id === nodeId);
    if (!originalNode) return;

    const maxZIndex = nodes.reduce((max, node) => Math.max(node.zIndex || 0, max), 0);
    const newData = JSON.parse(JSON.stringify(originalNode.data));

    const newNode = {
      ...originalNode,
      id: `${originalNode.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      position: { x: originalNode.position.x + 50, y: originalNode.position.y + 50 },
      data: newData,
      selected: false,
      zIndex: maxZIndex + 1,
    };

    set({ nodes: [...nodes, newNode] });
    get().setSelectedNodeId(newNode.id);
  },

  updateNodeData: (nodeId, dataUpdate) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...dataUpdate } } : node
      ),
    }));
  },

  addNode: (type, position = { x: 100, y: 100 }) => {
    const newNodeData = createNodeData(type);
    const newNode = {
        id: newNodeData.id,
        type,
        position,
        data: newNodeData,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  // --- 👇 Functions from previous development ---
  addReply: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const nodeType = node.type;
            const newReply = {
            display: nodeType === 'branch' ? 'New Condition' : (nodeType === 'fixedmenu' ? 'New Menu' : 'New Reply'),
            value: `${nodeType === 'branch' ? 'cond' : (nodeType === 'fixedmenu' ? 'menu' : 'val')}_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            };
          const newReplies = [...(node.data.replies || []), newReply];
          return { ...node, data: { ...node.data, replies: newReplies } };
        }
        return node;
      }),
    }));
  },

  updateReply: (nodeId, index, part, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const newReplies = [...node.data.replies];
          newReplies[index] = { ...newReplies[index], [part]: value };
          return { ...node, data: { ...node.data, replies: newReplies } };
        }
        return node;
      }),
    }));
  },

  deleteReply: (nodeId, index) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const newReplies = node.data.replies.filter((_, i) => i !== index);
          return { ...node, data: { ...node.data, replies: newReplies } };
        }
        return node;
      }),
    }));
  },

  addElement: (nodeId, elementType) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElement = createFormElement(elementType);
          const newElements = [...(node.data.elements || []), newElement];
          return { ...node, data: { ...node.data, elements: newElements } };
        }
        return node;
      }),
    }));
  },

  updateElement: (nodeId, elementIndex, elementUpdate) => {
    set((state) => ({
        nodes: state.nodes.map((node) => {
            if (node.id === nodeId && node.type === 'form') {
                const newElements = [...node.data.elements];
                const oldElement = newElements[elementIndex];
                const newElement = { ...oldElement, ...elementUpdate };

                if (newElement.type === 'grid' && (oldElement.rows !== newElement.rows || oldElement.columns !== newElement.columns)) {
                    const oldData = oldElement.data || [];
                    const newRows = newElement.rows || 2;
                    const newColumns = newElement.columns || 2;
                    const newData = Array(newRows * newColumns).fill('');

                    for (let r = 0; r < Math.min(oldElement.rows || 0, newRows); r++) {
                        for (let c = 0; c < Math.min(oldElement.columns || 0, newColumns); c++) {
                            const oldIndex = r * (oldElement.columns || 0) + c;
                            const newIndex = r * newColumns + c;
                            if (oldData[oldIndex] !== undefined) {
                                newData[newIndex] = oldData[oldIndex];
                            }
                        }
                    }
                    newElement.data = newData;
                }

                newElements[elementIndex] = newElement;
                return { ...node, data: { ...node.data, elements: newElements } };
            }
            return node;
        }),
    }));
  },

  deleteElement: (nodeId, elementIndex) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElements = node.data.elements.filter((_, i) => i !== elementIndex);
          return { ...node, data: { ...node.data, elements: newElements } };
        }
        return node;
      }),
    }));
  },

  updateGridCell: (nodeId, elementIndex, rowIndex, colIndex, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElements = JSON.parse(JSON.stringify(node.data.elements));
          const gridElement = newElements[elementIndex];

          if (gridElement && gridElement.type === 'grid') {
            const index = rowIndex * gridElement.columns + colIndex;
            gridElement.data[index] = value;
            return { ...node, data: { ...node.data, elements: newElements } };
          }
        }
        return node;
      }),
    }));
  },

  moveElement: (nodeId, startIndex, endIndex) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElements = [...node.data.elements];
          const [removed] = newElements.splice(startIndex, 1);
          newElements.splice(endIndex, 0, removed);
          return { ...node, data: { ...node.data, elements: newElements } };
        }
        return node;
      }),
    }));
  },

  exportSelectedNodes: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));

    const relevantEdges = edges.filter(e =>
      selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    const dataToExport = { nodes: selectedNodes, edges: relevantEdges };

    navigator.clipboard.writeText(JSON.stringify(dataToExport, null, 2))
      .then(() => alert(`${selectedNodes.length} nodes exported to clipboard!`))
      .catch(err => console.error('Failed to export nodes: ', err));
  },

  importNodes: async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const dataToImport = JSON.parse(clipboardText);

      if (!dataToImport.nodes || !Array.isArray(dataToImport.nodes)) {
        throw new Error('Invalid data format in clipboard.');
      }

      const { nodes: currentNodes, edges: currentEdges } = get();
      const idMapping = new Map();

      const newNodes = dataToImport.nodes.map((node, index) => {
        const oldId = node.id;
        const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${index}`;
        idMapping.set(oldId, newId);

        return {
          ...node,
          id: newId,
          position: { x: node.position.x + 20, y: node.position.y + 20 },
          selected: false,
        };
      });

      const newEdges = (dataToImport.edges || []).map(edge => {
        const newSource = idMapping.get(edge.source);
        const newTarget = idMapping.get(edge.target);
        if (newSource && newTarget) {
          return {
            ...edge,
            id: `reactflow__edge-${newSource}${edge.sourceHandle || ''}-${newTarget}${edge.targetHandle || ''}`,
            source: newSource,
            target: newTarget,
          };
        }
        return null;
      }).filter(Boolean);

      set({
        nodes: [...currentNodes, ...newNodes],
        edges: [...currentEdges, ...newEdges],
      });

      alert(`${newNodes.length} nodes imported successfully!`);

    } catch (err) {
      console.error('Failed to import nodes: ', err);
      alert('Failed to import nodes from clipboard. Check console for details.');
    }
  },

  addScenarioAsGroup: async (backend, scenario, position) => {
    const { nodes: currentNodes, edges: currentEdges } = get();

    const scenarioData = await backendService.fetchScenarioData(backend, { scenarioId: scenario.id });
    if (!scenarioData || !scenarioData.nodes || scenarioData.nodes.length === 0) {
      alert(`Failed to load scenario data for '${scenario.name}' or it is empty.`);
      return;
    }

    const PADDING = 40;

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    scenarioData.nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      const nodeWidth = node.width || 250;
      const nodeHeight = node.height || 150;
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    const groupPosition = position ? position : { x: minX, y: minY };
    const groupWidth = (maxX - minX) + PADDING * 2;
    const groupHeight = (maxY - minY) + PADDING * 2;

    const idPrefix = `group-${scenario.id}-${Date.now()}`;
    const groupNodeId = `group-${idPrefix}`;
    const idMapping = new Map();

    const childNodes = scenarioData.nodes.map(node => {
      const newId = `${idPrefix}-${node.id}`;
      idMapping.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x - minX + PADDING,
          y: node.position.y - minY + PADDING
        },
        parentNode: groupNodeId,
        extent: 'parent'
      };
    });

    const groupNode = {
      id: groupNodeId,
      type: 'scenario',
      position: groupPosition,
      data: { label: scenario.name, scenarioId: scenario.id, isCollapsed: false },
      style: { width: groupWidth, height: groupHeight },
    };

    const newEdges = (scenarioData.edges || []).map(edge => ({
      ...edge,
      id: `${idPrefix}-${edge.id}`,
      source: idMapping.get(edge.source),
      target: idMapping.get(edge.target),
    }));

    set({
      nodes: [...currentNodes, groupNode, ...childNodes],
      edges: [...currentEdges, ...newEdges],
    });
  },

  fetchScenario: async (backend, scenarioId) => {
    try {
      const data = await backendService.fetchScenarioData(backend, { scenarioId });
      // <<< [추가] 시나리오 로드 시 startNodeId도 설정 (백엔드에 저장된 값이 있다면) >>>
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        selectedNodeId: null,
        startNodeId: data.startNodeId || null // <<< [추가]
      });
    } catch (error) {
      console.error("Error fetching scenario:", error);
      alert('Failed to load scenario details.');
      set({ nodes: [], edges: [], selectedNodeId: null, startNodeId: null }); // <<< [수정] startNodeId 초기화 추가
    }
  },

  saveScenario: async (backend, scenario) => {
    try {
      const { nodes, edges, startNodeId } = get(); // <<< [수정] startNodeId 가져오기
      await backendService.saveScenarioData(backend, {
        scenario,
        // <<< [수정] 저장 데이터에 startNodeId 포함 >>>
        data: { nodes, edges, startNodeId },
      });
      alert(`Scenario '${scenario.name}' has been saved successfully!`); // 시나리오 이름 포함
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert(`Failed to save scenario: ${error.message}`);
    }
  },
}));

export default useStore;