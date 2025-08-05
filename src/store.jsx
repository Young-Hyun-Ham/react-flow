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

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
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
      case 'text':
        newNode.data = { id: 'new_text', content: '새 텍스트 메시지' };
        break;
      case 'slotFilling':
        newNode.data = { id: 'new_slot', content: '질문을 입력하세요.', slot: 'newSlot', replies: [] }; // replies를 빈 배열로 초기화
        break;
      case 'confirmation':
        newNode.data = { id: 'new_confirm', content: '확인 질문을 입력하세요.', replies: [{ display: '확인', value: 'confirm' }, { display: '취소', value: 'cancel' }] };
        break;
      default:
        break;
    }

    set({ nodes: [...get().nodes, newNode] });
  },

  // --- 💡 추가된 부분: Quick Reply 관련 액션 ---
  addReply: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const newReplies = [...(node.data.replies || []), { display: '새 답장', value: 'newValue' }];
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
  // --- 여기까지 ---

  fetchScenario: async (scenarioId) => {
    if (!scenarioId) return;
    const scenarioDocRef = doc(db, "scenarios", scenarioId);
    try {
      const docSnap = await getDoc(scenarioDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ nodes: data.nodes || [], edges: data.edges || [] });
      } else {
        console.log(`No such document for scenario: ${scenarioId}!`);
        set({ nodes: [], edges: [] });
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