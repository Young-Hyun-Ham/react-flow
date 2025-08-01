import { useMemo, useEffect } from 'react'; // useEffect import
import ReactFlow, { Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import TextNode from './nodes/TextNode';
import SlotFillingNode from './nodes/SlotFillingNode';
import ConfirmationNode from './nodes/ConfirmationNode';
import ChatbotSimulator from './ChatbotSimulator'; 
import useStore from './store';

function Flow() {
  const nodeTypes = useMemo(() => ({
    text: TextNode,
    slotFilling: SlotFillingNode,
    confirmation: ConfirmationNode,
  }), []);

  // 1. 스토어에서 새로운 액션들을 가져옵니다.
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchScenario, saveScenario } = useStore();

  // 2. 컴포넌트가 처음 마운트될 때 DB에서 데이터를 불러옵니다.
  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]); // fetchScenario는 안정적이므로 이 훅은 한 번만 실행됩니다.

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        {/* 3. 시나리오 저장 버튼 추가 */}
        <button
          onClick={saveScenario}
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            zIndex: 10,
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Save Scenario
        </button>

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
      
      <ChatbotSimulator nodes={nodes} edges={edges} />
    </div>
  );
}

export default Flow;
