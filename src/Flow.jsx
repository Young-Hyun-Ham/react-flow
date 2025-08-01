import { useMemo } from 'react';
import ReactFlow, { Controls } from 'reactflow';
import 'reactflow/dist/style.css';

// 커스텀 노드 컴포넌트들
import TextNode from './TextNode';
import SlotFillingNode from './SlotFillingNode';
import ConfirmationNode from './ConfirmationNode';
// 시뮬레이터는 그대로 유지
import ChatbotSimulator from './ChatbotSimulator'; 

// 1. Zustand 스토어를 import 합니다.
import useStore from './store';

function Flow() {
  const nodeTypes = useMemo(() => ({
    text: TextNode,
    slotFilling: SlotFillingNode,
    confirmation: ConfirmationNode,
  }), []);

  // 2. useState와 콜백 함수들을 모두 제거하고, 스토어에서 상태와 액션을 직접 가져옵니다.
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flexGrow: 1, height: '100%' }}>
        {/* 3. 스토어에서 가져온 상태와 액션을 ReactFlow에 그대로 전달합니다. */}
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

      {/* 시뮬레이터는 스토어에서 직접 데이터를 가져오도록 수정하거나, 그대로 props를 전달할 수 있습니다. */}
      {/* 여기서는 간단하게 props를 전달하는 방식을 유지합니다. */}
      <ChatbotSimulator nodes={nodes} edges={edges} />
    </div>
  );
}

export default Flow;