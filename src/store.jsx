import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './firebase';
import { createNodeData } from './nodeFactory';
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
}

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  anchorNodeId: null,
  nodeColors: defaultColors,
  nodeTextColors: defaultTextColors,
  slots: {},

  setAnchorNodeId: (nodeId) => {
    set((state) => ({
      anchorNodeId: state.anchorNodeId === nodeId ? null : nodeId,
    }));
  },

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
      
      return {
        nodes: remainingNodes,
        edges: remainingEdges,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
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
            const PADDING = 20;
            const childNodes = state.nodes.filter(child => child.parentNode === nodeId);
            if (childNodes.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
              childNodes.forEach(node => {
                const x = node.position.x;
                const y = node.position.y;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + (node.width || 250));
                maxY = Math.max(maxY, y + (node.height || 150));
              });
              
              newStyle.width = (maxX - minX) + PADDING * 2;
              newStyle.height = (maxY - minY) + PADDING * 2;
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

  // --- 👇 복원된 함수들 ---
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
  // --- 👆 복원된 함수들 ---

  addScenarioAsGroup: async (backend, scenario, position = { x: 200, y: 200 }) => {
    const { nodes: currentNodes, edges: currentEdges } = get();
    
    const scenarioData = await backendService.fetchScenarioData(backend, { scenarioId: scenario.id });
    if (!scenarioData || !scenarioData.nodes) {
      alert(`Failed to load scenario data for '${scenario.name}'.`);
      return;
    }

    const idPrefix = `group-${scenario.id}-${Date.now()}`;
    const idMapping = new Map();
    
    const childNodes = scenarioData.nodes.map(node => {
      const newId = `${idPrefix}-${node.id}`;
      idMapping.set(node.id, newId);
      return { ...node, id: newId };
    });

    const groupNodeId = `group-${idPrefix}`;
    const groupNode = {
      id: groupNodeId,
      type: 'scenario',
      position,
      data: { label: scenario.name, scenarioId: scenario.id, isCollapsed: true },
      style: { width: 250, height: 50 },
    };

    childNodes.forEach(node => {
      node.parentNode = groupNodeId;
      node.extent = 'parent';
    });

    const newEdges = scenarioData.edges.map(edge => ({
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
      set({ nodes: data.nodes || [], edges: data.edges || [], selectedNodeId: null });
    } catch (error) {
      console.error("Error fetching scenario:", error);
      alert('Failed to load scenario details.');
      set({ nodes: [], edges: [], selectedNodeId: null });
    }
  },

  saveScenario: async (backend, scenario) => {
    try {
      const { nodes, edges } = get();
      await backendService.saveScenarioData(backend, {
        scenario,
        data: { nodes, edges },
      });
      alert(`Scenario has been saved successfully!`);
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert(`Failed to save scenario: ${error.message}`);
    }
  },
}));

export default useStore;