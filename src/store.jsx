import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
// 1. Firebase 관련 모듈과 DB 인스턴스를 import 합니다.
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './firebase';

// 기존 초기 데이터는 DB에 데이터가 없을 때 사용할 기본값(fallback)으로 활용합니다.
const initialNodes = [
    { id: '1', type: 'text', position: { x: 50, y: 50 }, data: { id: 'start', content: '선박 예약을 시작합니다! :)' } },
    { id: '2', type: 'slotFilling', position: { x: 350, y: 10 }, data: { id: 'ask_departure_port', content: '출발 항구를 입력해주세요!!', slot: 'departurePort' } },
    { id: '3', type: 'slotFilling', position: { x: 350, y: 150 }, data: { id: 'ask_departure_port', content: '도착 항구를 입력해주세요!!', slot: 'destinationPort' } },
    { id: '4', type: 'slotFilling', position: { x: 350, y: 300 }, data: { id: 'ask_container_type', content: '컨테이너 타입을 선택해주세요.', slot: 'containerType', replies: [{ display: 'Dry', value: 'Dry' }, { display: 'Reefer', value: 'Reefer' }] }},
    { id: '5', type: 'confirmation', position: { x: 650, y: 300 }, data: { id: 'confirm_booking', content: '다음과 같이 예약하시겠습니까?\n출발:{departurePort}\n도착:{destinationPort}', replies: [{ display: '확정', value: 'confirm' }, { display: '취소', value: 'cancel' }] }},
    { id: '6', type: 'text', position: { x: 950, y: 270 }, data: { id: 'booking_confirmed', content: '예약이 확정되었습니다. 감사합니다!' } },
    { id: '7', type: 'text', position: { x: 950, y: 370 }, data: { id: 'booking_cancelled', content: '예약이 취소되었습니다.' } },
];
const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e3-4', source: '3', target: '4' },
    { id: 'e4-5', source: '4', target: '5' },
    { id: 'e5-6', source: '5', target: '6', sourceHandle: 'confirm' },
    { id: 'e5-7', source: '5', target: '7', sourceHandle: 'cancel' },
];

// 데이터를 저장할 문서의 참조를 미리 정의합니다.
const scenarioDocRef = doc(db, "scenarios", "mainScenario");

const useStore = create((set, get) => ({
  // 2. 초기 상태는 빈 배열로 시작합니다. 데이터는 DB에서 불러옵니다.
  nodes: [],
  edges: [],
  
  // ... 기존 onNodesChange, onEdgesChange, onConnect, deleteNode, updateNodeData 등 액션들 ...
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  deleteNode: (nodeId) => { /* ... */ },
  updateNodeData: (nodeId, newData) => { /* ... */ },
  addReply: (nodeId) => { /* ... */ },
  updateReply: (nodeId, index, part, value) => { /* ... */ },
  deleteReply: (nodeId, index) => { /* ... */ },

  updateNodeContent: (nodeId, content) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, content } } : node
      ),
    }));
  },


  // 3. DB에서 시나리오 데이터를 불러오는 액션
  fetchScenario: async () => {
    try {
      const docSnap = await getDoc(scenarioDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // DB에 저장된 nodes와 edges로 상태를 설정합니다.
        set({ nodes: data.nodes || [], edges: data.edges || [] });
      } else {
        // 문서가 없으면(최초 실행 시) initial 데이터로 문서를 생성하고 상태를 설정합니다.
        console.log("No such document! Creating one with initial data.");
        await setDoc(scenarioDocRef, { nodes: initialNodes, edges: initialEdges });
        set({ nodes: initialNodes, edges: initialEdges });
      }
    } catch (error) {
      console.error("Error fetching scenario:", error);
    }
  },

  // 4. 현재 시나리오를 DB에 저장하는 액션
  saveScenario: async () => {
    try {
      const { nodes, edges } = get();
      await setDoc(scenarioDocRef, { nodes, edges });
      alert('시나리오가 저장되었습니다!'); // 사용자에게 피드백
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert('저장에 실패했습니다.');
    }
  },
}));

export default useStore;
