import { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';

// React Flow의 기본 스타일을 불러옵니다.
import 'reactflow/dist/style.css';

// 화면에 초기에 렌더링될 노드들을 정의합니다.
const initialNodes = [
  {
    id: '1',
    type: 'input', // 입력 노드 타입
    data: { label: '시작 노드' },
    position: { x: 250, y: 5 },
  },
  {
    id: '2',
    data: { label: '중간 노드' },
    position: { x: 100, y: 100 },
  },
  {
    id: '3',
    type: 'output', // 출력 노드 타입
    data: { label: '종료 노드' },
    position: { x: 400, y: 100 },
  },
];

// 초기에 렌더링될 엣지(연결선)를 정의합니다.
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '첫 번째 연결' },
  { id: 'e1-3', source: '1', target: '3', animated: true }, // animated: true로 애니메이션 효과 추가
];

function Flow() {
  // useNodesState와 useEdgesState Hook을 사용하여 노드와 엣지의 상태를 관리합니다.
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // 노드가 변경될 때 (드래그, 삭제 등) 호출되는 콜백 함수
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  // 엣지가 변경될 때 호출되는 콜백 함수
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // 노드와 노드를 연결할 때 호출되는 콜백 함수
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ height: '100vh', width: '800px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView // 초기 렌더링 시 모든 노드가 보이도록 뷰를 조정합니다.
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

export default Flow;