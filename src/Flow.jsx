import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

import TextNode from './TextNode';
import SlotFillingNode from './SlotFillingNode';
import ConfirmationNode from './ConfirmationNode';
import ChatbotSimulator from './ChatbotSimulator'; // 시뮬레이터 import

function Flow() {
  const nodeTypes = useMemo(() => ({
    text: TextNode,
    slotFilling: SlotFillingNode,
    confirmation: ConfirmationNode,
  }), []);

  // initialNodes, initialEdges 데이터는 이전과 동일
  const initialNodes = [
    { id: '1', type: 'text', position: { x: 50, y: 50 }, data: { id: 'start', content: '선박 예약을 시작합니다! :)' } },
    { id: '2', type: 'slotFilling', position: { x: 350, y: 50 }, data: { id: 'ask_departure_port', content: '출발 항구를 입력해주세요!!', slot: 'departurePort' } },
    { id: '3', type: 'slotFilling', position: { x: 350, y: 300 }, data: { id: 'ask_container_type', content: '컨테이너 타입을 선택해주세요.', slot: 'containerType', replies: [{ display: 'Dry', value: 'Dry' }, { display: 'Reefer', value: 'Reefer' }] }},
    { id: '4', type: 'confirmation', position: { x: 650, y: 300 }, data: { id: 'confirm_booking', content: '다음과 같이 예약하시겠습니까?\n출발:{departurePort}\n도착:{destinationPort}', replies: [{ display: '확정', value: 'confirm' }, { display: '취소', value: 'cancel' }] }},
    { id: '5', type: 'text', position: { x: 950, y: 270 }, data: { id: 'booking_confirmed', content: '예약이 확정되었습니다. 감사합니다!' } },
    { id: '6', type: 'text', position: { x: 950, y: 370 }, data: { id: 'booking_cancelled', content: '예약이 취소되었습니다.' } },
  ];
  const initialEdges = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5', sourceHandle: 'confirm' },
      { id: 'e4-6', source: '4', target: '6', sourceHandle: 'cancel' },
  ];

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);

  return (
    // 1. 전체 레이아웃을 flexbox로 변경합니다.
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* React Flow 에디터 영역 */}
      <div style={{ flexGrow: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ backgroundColor: '#ffffff' }}
        >
          <Controls />
        </ReactFlow>
      </div>

      {/* 2. 시뮬레이터 컴포넌트를 배치하고 nodes와 edges 데이터를 전달합니다. */}
      <ChatbotSimulator nodes={nodes} edges={edges} />
    </div>
  );
}

export default Flow;