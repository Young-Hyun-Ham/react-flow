import { useMemo, useEffect } from 'react';
import ReactFlow, { Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import TextNode from './nodes/TextNode';
import SlotFillingNode from './nodes/SlotFillingNode';
import ConfirmationNode from './nodes/ConfirmationNode';
import ChatbotSimulator from './ChatbotSimulator';
import useStore from './store';

function Flow({ scenarioId, onBack }) {
  const nodeTypes = useMemo(() => ({
    text: TextNode,
    slotFilling: SlotFillingNode,
    confirmation: ConfirmationNode,
  }), []);

  // --- 💡 수정된 부분: addNode 액션 가져오기 ---
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchScenario, saveScenario, addNode } = useStore();

  useEffect(() => {
    if (scenarioId) {
      fetchScenario(scenarioId);
    }
  }, [scenarioId, fetchScenario]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        {/* --- 💡 추가된 부분: 노드 추가 패널 --- */}
        <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => addNode('text')} style={{ padding: '10px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '5px' }}>+ Text</button>
            <button onClick={() => addNode('slotFilling')} style={{ padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px' }}>+ Slot Filling</button>
            <button onClick={() => addNode('confirmation')} style={{ padding: '10px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px' }}>+ Confirmation</button>
        </div>

        <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 10, display: 'flex', gap: '10px' }}>
          <button onClick={onBack} style={{ padding: '10px 20px' }}>
            목록으로
          </button>
          <button
            onClick={() => saveScenario(scenarioId)}
            style={{
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
        </div>

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