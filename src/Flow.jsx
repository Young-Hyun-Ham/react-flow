import { useEffect, useState, useRef } from 'react';
import ReactFlow, { Controls, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';

import MessageNode from './nodes/MessageNode';
import BranchNode from './nodes/BranchNode';
import SlotFillingNode from './nodes/SlotFillingNode';
import ApiNode from './nodes/ApiNode';
import FormNode from './nodes/FormNode';
import FixedMenuNode from './nodes/FixedMenuNode';
import LinkNode from './nodes/LinkNode';
import LlmNode from './nodes/LlmNode';
import ToastNode from './nodes/ToastNode';
import ChatbotSimulator from './ChatbotSimulator';
import NodeController from './NodeController';
import useStore from './store';
import styles from './Flow.module.css';

const nodeTypes = {
  message: MessageNode,
  branch: BranchNode,
  slotfilling: SlotFillingNode,
  api: ApiNode,
  form: FormNode,
  fixedmenu: FixedMenuNode,
  link: LinkNode,
  llm: LlmNode,
  toast: ToastNode,
};

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </svg>
);

function Flow({ scenarioId }) {
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, 
    fetchScenario, saveScenario, addNode, selectedNodeId, 
    setSelectedNodeId, duplicateNode, deleteSelectedEdges, 
    nodeColors, setNodeColor, nodeTextColors, setNodeTextColor,
    // --- 👇 [추가] ---
    exportSelectedNodes, importNodes
  } = useStore();
  
  // --- 👇 [수정] reactflow 인스턴스에서 선택된 노드 정보를 가져옵니다. ---
  const { getNodes } = useReactFlow();
  const selectedNodesCount = getNodes().filter(n => n.selected).length;

  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);
  const [isColorSettingsVisible, setIsColorSettingsVisible] = useState(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  
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
    { type: 'slotfilling', label: '+ SlotFilling' },
    { type: 'api', label: '+ API' },
    { type: 'llm', label: '+ LLM' },
    { type: 'fixedmenu', label: '+ Fixed Menu' },
    { type: 'link', label: '+ Link' },
    { type: 'toast', label: '+ Toast' },
  ];

  return (
    <div className={styles.flowContainer}>
      <div className={styles.leftSidebar}>
        <div className={styles.sidebarHeader}>
            <h3>Add Node</h3>
            <span className={styles.globalColorSettingButton} onClick={() => setIsColorSettingsVisible(!isColorSettingsVisible)}>
                <SettingsIcon />
            </span>
        </div>

        {isColorSettingsVisible && (
            <div className={styles.colorSettingsPanel}>
                {nodeButtons.map(({ type, label }) => (
                    <div key={type} className={styles.colorSettingItem}>
                        <span>{label.replace('+ ', '')}</span>
                        <div className={styles.colorInputs}>
                          <input 
                              type="color" 
                              value={nodeColors[type]} 
                              onChange={(e) => setNodeColor(type, e.target.value)}
                          />
                          <input 
                              type="color" 
                              value={nodeTextColors[type]} 
                              onChange={(e) => setNodeTextColor(type, e.target.value)}
                          />
                        </div>
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
                    color: nodeTextColors[type] 
                }}
            >
                {label}
            </button>
        ))}
        
        {/* --- 👇 [수정/추가된 부분 시작] --- */}
        <div className={styles.separator} />
        <button onClick={importNodes} className={styles.sidebarButton} style={{backgroundColor: '#555', color: 'white'}}>
          Import Nodes
        </button>
        <button onClick={exportSelectedNodes} className={styles.sidebarButton} disabled={selectedNodesCount === 0} style={{backgroundColor: '#555', color: 'white'}}>
          Export Nodes ({selectedNodesCount})
        </button>
        {/* --- 👆 [여기까지] --- */}

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
          <div onClick={() => saveScenario(scenarioId)}>
            <img src="/images/save.png" alt="Save Icon" className={styles.saveButton}/>
          </div>
          <div onClick={() => setIsSimulatorVisible(!isSimulatorVisible)}>
            <img src="/images/chat_simulator.png" alt="Simulator Icon" className={!isSimulatorVisible ? styles.botButtonHidden : styles.botButton}/>
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

      <div className={`${styles.resizerV} ${isSimulatorVisible && !isSimulatorExpanded ? styles.visible : ''}`} onMouseDown={handleMainResize} />

      <div
        className={`${styles.rightContainer} ${isSimulatorVisible ? styles.visible : ''}`}
        style={{ width: isSimulatorExpanded ? 'max(600px, 50%)' : isSimulatorVisible ? `${rightPanelWidth}px` : '0' }}
      >
        <div className={styles.panel}>
          <ChatbotSimulator 
            nodes={nodes} 
            edges={edges} 
            isVisible={isSimulatorVisible}
            isExpanded={isSimulatorExpanded}
            setIsExpanded={setIsSimulatorExpanded}
          />
        </div>
      </div>
    </div>
  );
}

// --- 👇 [수정] ReactFlowProvider로 감싸줍니다. ---
import { ReactFlowProvider } from 'reactflow';

function FlowWithProvider(props) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}

export default FlowWithProvider;