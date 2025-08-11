import { useEffect, useState, useRef } from 'react';
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

// --- 💡 추가된 부분: 설정 SVG 아이콘 ---
const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </svg>
);

const getTextColorByBackgroundColor = (hexColor) => {
    if (!hexColor) return 'white';
    const c = hexColor.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? 'white' : 'black';
}

function Flow({ scenarioId, onBack }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchScenario, saveScenario, addNode, selectedNodeId, setSelectedNodeId, duplicateNode, deleteSelectedEdges, nodeColors, setNodeColor } = useStore();

  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);
  // --- 💡 추가된 부분: 색상 설정 패널 표시 여부 상태 ---
  const [isColorSettingsVisible, setIsColorSettingsVisible] = useState(false);

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

  const handleKeyDown = (event) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const isNodeSelected = nodes.some(node => node.selected);
      if (!isNodeSelected) {
        deleteSelectedEdges();
      }
    }
  };

  const nodeButtons = [
    { type: 'message', label: '+ Message' },
    { type: 'form', label: '+ Form' },
    { type: 'branch', label: '+ Condition Branch' },
    { type: 'api', label: '+ API' },
    { type: 'fixedmenu', label: '+ Fixed Menu' },
    { type: 'link', label: '+ Link' },
  ];

  return (
    <div className={styles.flowContainer}>
      <div className={styles.leftSidebar}>
        {/* --- 💡 수정된 부분: 헤더 구조 변경 --- */}
        <div className={styles.sidebarHeader}>
            <h3>Add Node</h3>
            <span className={styles.globalColorSettingButton} onClick={() => setIsColorSettingsVisible(!isColorSettingsVisible)}>
                <SettingsIcon />
            </span>
        </div>

        {/* --- 💡 수정된 부분: 색상 설정 패널 조건부 렌더링 --- */}
        {isColorSettingsVisible && (
            <div className={styles.colorSettingsPanel}>
                {nodeButtons.map(({ type, label }) => (
                    <div key={type} className={styles.colorSettingItem}>
                        <span>{label.replace('+ ', '')}</span>
                        <input 
                            type="color" 
                            value={nodeColors[type]} 
                            onChange={(e) => setNodeColor(type, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        )}

        {nodeButtons.map(({ type, label }) => (
            <button 
                key={type}
                onClick={() => addNode(type)} 
                className={styles.sidebarButton} 
                style={{ 
                    backgroundColor: nodeColors[type], 
                    color: getTextColorByBackgroundColor(nodeColors[type]) 
                }}
            >
                {label}
            </button>
        ))}

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
          <button onClick={onBack} className={styles.controlButton}>Back to List</button>
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
          onKeyDown={handleKeyDown}
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