import { useMemo, useEffect, useState, useCallback } from 'react';
import ReactFlow, { Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import TextNode from './nodes/TextNode';
import SlotFillingNode from './nodes/SlotFillingNode';
import ConfirmationNode from './nodes/ConfirmationNode';
import ChatbotSimulator from './ChatbotSimulator';
import NodeController from './NodeController';
import useStore from './store';
import styles from './Flow.module.css';

function Flow({ scenarioId, onBack }) {
  const nodeTypes = useMemo(() => ({
    text: TextNode,
    slotFilling: SlotFillingNode,
    confirmation: ConfirmationNode,
  }), []);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchScenario, saveScenario, addNode, setSelectedNodeId } = useStore();

  // --- 💡 추가된 부분: 리사이징을 위한 상태 ---
  const [rightPanelWidth, setRightPanelWidth] = useState(760);
  const [controllerWidth, setControllerWidth] = useState(380);

  useEffect(() => {
    if (scenarioId) {
      fetchScenario(scenarioId);
    }
  }, [scenarioId, fetchScenario]);

  const handleNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
  };

  const handlePaneClick = () => {
    setSelectedNodeId(null);
  };

  // --- 💡 추가된 부분: 리사이저 드래그 이벤트 핸들러 ---
  const createResizeHandler = (setter, initialSize) => (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startSize = initialSize;
    const startPosition = mouseDownEvent.clientX;

    const onMouseMove = (mouseMoveEvent) => {
      const newSize = startSize - (mouseMoveEvent.clientX - startPosition);
      // 패널의 최소/최대 너비 제한
      if (newSize > 300 && newSize < 1200) {
        setter(newSize);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  
  const handleMainResize = createResizeHandler(setRightPanelWidth, rightPanelWidth);
  const handleSideResize = createResizeHandler(setControllerWidth, controllerWidth);


  return (
    <div className={styles.flowContainer}>
      <div className={styles.leftSidebar}>
        <h3>노드 추가</h3>
        <button onClick={() => addNode('text')} className={`${styles.sidebarButton} ${styles.textButton}`}>+ Text</button>
        <button onClick={() => addNode('slotFilling')} className={`${styles.sidebarButton} ${styles.slotButton}`}>+ Slot Filling</button>
        <button onClick={() => addNode('confirmation')} className={`${styles.sidebarButton} ${styles.confirmButton}`}>+ Confirmation</button>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topRightControls}>
          <button onClick={onBack} className={styles.controlButton}>목록으로</button>
          <button onClick={() => saveScenario(scenarioId)} className={`${styles.controlButton} ${styles.saveButton}`}>Save Scenario</button>
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
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
        >
          <Controls />
        </ReactFlow>
      </div>
      
      {/* --- 💡 수정된 부분: 리사이저 및 패널 구조 변경 --- */}
      <div className={styles.resizerV} onMouseDown={handleMainResize} />
      <div className={styles.rightContainer} style={{ width: `${rightPanelWidth}px` }}>
        <div className={styles.panel} style={{ width: `${controllerWidth}px` }}>
          <NodeController />
        </div>
        <div className={styles.resizerH} onMouseDown={handleSideResize} />
        <div className={styles.panel} style={{ flex: 1 }}>
          <ChatbotSimulator nodes={nodes} edges={edges} />
        </div>
      </div>
    </div>
  );
}

export default Flow;
