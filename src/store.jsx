import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './firebase';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

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
      id: `${type}-${+new Date()}`,
      type,
      position: { x: 100, y: 100 },
      data: {},
    };

    switch (type) {
      case 'message':
        newNode.data = { id: 'new_message', content: '새 텍스트 메시지', replies: [] };
        break;
      case 'api':
        newNode.data = { id: 'new_api', content: '질문을 입력하세요.', slot: 'newSlot', replies: [] };
        break;
      case 'branch':
        newNode.data = { id: 'new_branch', content: '조건 분기 질문을 입력하세요.', replies: [{ display: '조건1', value: `cond_${+new Date()}` }, { display: '조건2', value: `cond_${+new Date() + 1}` }] };
        break;
      case 'form':
        newNode.data = {
          id: 'new_form',
          title: '새 양식',
          elements: [],
          dataSourceType: 'json',
          dataSource: ''
        };
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
            display: nodeType === 'branch' ? '새 조건' : '새 답장',
            value: `${nodeType === 'branch' ? 'cond' : 'val'}_${+new Date()}`
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
          const newId = `${elementType}-${+new Date()}`;

          switch (elementType) {
            case 'input':
              newElement = { id: newId, type: 'input', name: '', label: 'New Input', placeholder: '', validation: { type: 'text' } };
              break;
            case 'date':
              newElement = { id: newId, type: 'date', name: '', label: 'New Date' };
              break;
            // --- 💡 수정된 부분: Grid 생성 시 name과 label 추가 ---
            case 'grid':
              newElement = { id: newId, type: 'grid', name: '', label: 'New Grid', rows: 2, columns: 2, items: [] };
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
          newElements[elementIndex] = { ...newElements[elementIndex], ...elementUpdate };
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
      alert('저장할 시나리오가 선택되지 않았습니다.');
      return;
    }
    const scenarioDocRef = doc(db, "scenarios", scenarioId);
    try {
      const { nodes, edges } = get();
      await setDoc(scenarioDocRef, { nodes, edges });
      alert(`'${scenarioId}' 시나리오가 저장되었습니다!`);
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert('저장에 실패했습니다.');
    }
  },
}));

export default useStore;