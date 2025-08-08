import { useMemo, useEffect, useState } from 'react';
import ReactFlow, { Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import MessageNode from './nodes/MessageNode';
import BranchNode from './nodes/BranchNode';
import ApiNode from './nodes/ApiNode';
import FormNode from './nodes/FormNode';
import FixedMenuNode from './nodes/FixedMenuNode';
import LinkNode from './nodes/LinkNode';
import ChatbotSimulator from './ChatbotSimulator';
import NodeController from './NodeController';
import useStore from './store';
import styles from './Flow.module.css';

const nodeTypes = {
  message: MessageNode,
  branch: BranchNode,
  api: ApiNode,
  form: FormNode,
  fixedmenu: FixedMenuNode,
  link: LinkNode,
};

function Flow({ scenarioId, onBack }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchScenario, saveScenario, addNode, selectedNodeId, setSelectedNodeId, duplicateNode } = useStore();

  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);

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
      if (newSize > 350 && newSize < 1000) {
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

  const handleDuplicateNode = () => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  };

  return (
    <div className={styles.flowContainer}>
      <div className={styles.leftSidebar}>
        <h3>노드 추가</h3>
        <button onClick={() => addNode('message')} className={`${styles.sidebarButton} ${styles.messageButton}`}>+ Message</button>
        <button onClick={() => addNode('form')} className={`${styles.sidebarButton} ${styles.formButton}`}>+ Form</button>
        <button onClick={() => addNode('branch')} className={`${styles.sidebarButton} ${styles.branchButton}`}>+ 조건분기</button>
        <button onClick={() => addNode('api')} className={`${styles.sidebarButton} ${styles.apiButton}`}>+ API</button>
        <button onClick={() => addNode('fixedmenu')} className={`${styles.sidebarButton} ${styles.fixedMenuButton}`}>+ 고정메뉴</button>
        <button onClick={() => addNode('link')} className={`${styles.sidebarButton} ${styles.linkButton}`}>+ 링크</button>

        {selectedNodeId && (
          <>
            <div className={styles.separator} />
            <button onClick={handleDuplicateNode} className={`${styles.sidebarButton} ${styles.duplicateButton}`}>
              + Duplicate Node
            </button>
          </>
        )}
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topRightControls}>
          <button onClick={onBack} className={styles.controlButton}>목록으로</button>
          <button onClick={() => saveScenario(scenarioId)} className={`${styles.controlButton} ${styles.saveButton}`}>Save Scenario</button>
          <div onClick={() => setIsSimulatorVisible(!isSimulatorVisible)} className={!isSimulatorVisible ? styles.botButtonHidden : styles.botButton}>
            🤖
          </div>
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

      <div className={`${styles.controllerPanel} ${selectedNodeId ? styles.visible : ''}`}>
        <NodeController />
      </div>

      <div className={`${styles.resizerV} ${isSimulatorVisible ? styles.visible : ''}`} onMouseDown={handleMainResize} />

      <div
        className={`${styles.rightContainer} ${isSimulatorVisible ? styles.visible : ''}`}
        style={{ '--right-panel-width': `${rightPanelWidth}px` }}
      >
        <div className={styles.panel}>
          <ChatbotSimulator nodes={nodes} edges={edges} isVisible={isSimulatorVisible} />
        </div>
      </div>
    </div>
  );
}

export default Flow;