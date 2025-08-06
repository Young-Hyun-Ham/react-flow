import { useMemo, useEffect, useState } from 'react';
import ReactFlow, { Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import MessageNode from './nodes/MessageNode'; // 💡 변경
import BranchNode from './nodes/BranchNode'; // 💡 변경
import ApiNode from './nodes/ApiNode'; // 💡 변경
import FormNode from './nodes/FormNode';
import ChatbotSimulator from './ChatbotSimulator';
import NodeController from './NodeController';
import useStore from './store';
import styles from './Flow.module.css';

function Flow({ scenarioId, onBack }) {
  const nodeTypes = useMemo(() => ({
    message: MessageNode, // 💡 변경
    branch: BranchNode, // 💡 변경
    api: ApiNode, // 💡 변경
    form: FormNode,
  }), []);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchScenario, saveScenario, addNode, setSelectedNodeId } = useStore();

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

  const handleMainResize = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startSize = rightPanelWidth;
    const startPosition = mouseDownEvent.clientX;

    const onMouseMove = (mouseMoveEvent) => {
      const newSize = startSize - (mouseMoveEvent.clientX - startPosition);
      if (newSize > 600 && newSize < 1200) {
        setRightPanelWidth(newSize);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleSideResize = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startSize = controllerWidth;
    const startPosition = mouseDownEvent.clientX;

    const onMouseMove = (mouseMoveEvent) => {
      const newSize = startSize + (mouseMoveEvent.clientX - startPosition);
      const totalWidth = rightPanelWidth;
      if (newSize > 300 && (totalWidth - newSize) > 300) {
        setControllerWidth(newSize);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className={styles.flowContainer}>
      <div className={styles.leftSidebar}>
        <h3>노드 추가</h3>
        {/* --- 💡 수정된 부분 --- */}
        <button onClick={() => addNode('message')} className={`${styles.sidebarButton} ${styles.messageButton}`}>+ Message</button>
        <button onClick={() => addNode('form')} className={`${styles.sidebarButton} ${styles.formButton}`}>+ Form</button>
        <button onClick={() => addNode('branch')} className={`${styles.sidebarButton} ${styles.branchButton}`}>+ 조건분기</button>
        <button onClick={() => addNode('api')} className={`${styles.sidebarButton} ${styles.apiButton}`}>+ API</button>
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