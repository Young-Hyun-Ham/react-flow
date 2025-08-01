import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

// 초기 노드와 엣지 데이터
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


// Zustand 스토어 생성
const useStore = create((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,

  // React Flow의 onNodesChange 이벤트 핸들러
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  // React Flow의 onEdgesChange 이벤트 핸들러
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  // React Flow의 onConnect 이벤트 핸들러
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  // 특정 노드를 삭제하는 액션
  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter(node => node.id !== nodeId),
      edges: get().edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
    });
  },

  // (예시) 노드 내부의 컨텐츠를 업데이트하는 액션
  updateNodeContent: (nodeId, newContent) => {
    console.log('Updating node content:', nodeId, newContent);
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, content: newContent } };
        }
        return node;
      }),
    });
  },
}));

export default useStore;