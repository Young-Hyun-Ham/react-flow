import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './firebase';

const defaultColors = {
  message: '#f39c12',
  form: '#9b59b6',
  branch: '#2ecc71',
  slotfilling: '#3498db',
  api: '#e74c3c',
  fixedmenu: '#e74c3c',
  link: '#34495e',
};

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  nodeColors: defaultColors,

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

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
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
      position: {
        x: originalNode.position.x + 50,
        y: originalNode.position.y + 50,
      },
      data: newData,
      selected: false,
      zIndex: maxZIndex + 1,
    };

    set({
      nodes: [...nodes, newNode],
    });
    get().setSelectedNodeId(newNode.id);
  },

  updateNodeData: (nodeId, dataUpdate) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...dataUpdate } }
          : node
      ),
    }));
  },

  addNode: (type) => {
    const newNode = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      position: { x: 100, y: 100 },
      data: {},
    };

    switch (type) {
      case 'message':
        newNode.data = { id: 'new_message', content: 'New text message', replies: [] };
        break;
      case 'slotfilling':
        newNode.data = { id: 'new_slotfilling', content: 'Enter your question.', slot: 'newSlot', replies: [] };
        break;
      case 'api':
        newNode.data = { id: 'new_api', method: 'GET', url: '', headers: '{}', body: '{}' };
        break;
      case 'branch':
        newNode.data = { id: 'new_branch', content: 'Enter your conditional branch question.', replies: [{ display: 'Condition 1', value: `cond_${Date.now()}` }, { display: 'Condition 2', value: `cond_${Date.now() + 1}` }] };
        break;
      case 'form':
        newNode.data = {
          id: 'new_form',
          title: 'new form',
          elements: [],
          dataSourceType: 'json',
          dataSource: ''
        };
        break;
      case 'fixedmenu':
        newNode.data = { id: 'new_fixedmenu', title: 'Fixed Menu', replies: [{ display: 'Menu 1', value: `menu_${Date.now()}` }, { display: 'Menu 2', value: `menu_${Date.now() + 1}` }] };
        break;
      case 'link':
        newNode.data = { id: 'new_link', content: 'https://', display: 'Link' };
        break;
      default:
        break;
    }

    set({ nodes: [...get().nodes, newNode] });
  },

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
          let newElement;
          const newId = `${elementType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          switch (elementType) {
            case 'input':
              newElement = { id: newId, type: 'input', name: '', label: 'New Input', placeholder: '', validation: { type: 'text' } };
              break;
            case 'date':
              newElement = { id: newId, type: 'date', name: '', label: 'New Date' };
              break;
            case 'grid':
              const rows = 2;
              const columns = 2;
              newElement = {
                id: newId,
                type: 'grid',
                name: '',
                label: 'New Grid',
                rows: rows,
                columns: columns,
                data: Array(rows * columns).fill('')
              };
              break;
            case 'checkbox':
              newElement = { id: newId, type: 'checkbox', name: '', label: 'New Checkbox', options: [] };
              break;
            case 'dropbox':
              newElement = { id: newId, type: 'dropbox', name: '', label: 'New Dropbox', options: [] };
              break;
            default:
              newElement = { id: newId, type: elementType };
          }

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

                if (
                    newElement.type === 'grid' &&
                    (oldElement.rows !== newElement.rows || oldElement.columns !== newElement.columns)
                ) {
                    const oldData = oldElement.data || [];
                    const newRows = newElement.rows || 2;
                    const newColumns = newElement.columns || 2;
                    const newData = Array(newRows * newColumns).fill('');

                    for (let r = 0; r < Math.min(oldElement.rows, newRows); r++) {
                        for (let c = 0; c < Math.min(oldElement.columns, newColumns); c++) {
                            const oldIndex = r * oldElement.columns + c;
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

  fetchScenario: async (scenarioId) => {
    if (!scenarioId) return;
    const scenarioDocRef = doc(db, "scenarios", scenarioId);
    try {
      const docSnap = await getDoc(scenarioDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ nodes: data.nodes || [], edges: data.edges || [], selectedNodeId: null });
      } else {
        console.log(`No such document for scenario: ${scenarioId}!`);
        set({ nodes: [], edges: [], selectedNodeId: null });
      }
    } catch (error) {
      console.error("Error fetching scenario:", error);
    }
  },

  saveScenario: async (scenarioId) => {
    if (!scenarioId) {
      alert('No scenario selected to save.');
      return;
    }
    const scenarioDocRef = doc(db, "scenarios", scenarioId);
    try {
      const { nodes, edges } = get();
      await setDoc(scenarioDocRef, { nodes, edges });
      alert(`Scenario '${scenarioId}' has been saved!`);
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert('Failed to save.');
    }
  },
}));

export default useStore;