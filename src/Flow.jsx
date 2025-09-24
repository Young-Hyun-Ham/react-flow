import { useEffect, useState } from 'react';
import ReactFlow, { Controls, useReactFlow, MiniMap } from 'reactflow';
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
import IframeNode from './nodes/IframeNode';
import ChatbotSimulator from './ChatbotSimulator';
import NodeController from './NodeController';
import useStore from './store';
import SlotDisplay from './SlotDisplay';
import styles from './Flow.module.css';
import { SettingsIcon } from './components/Icons';

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
  iframe: IframeNode,
};

function Flow({ scenario, backend }) {
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, 
    fetchScenario, saveScenario, addNode, selectedNodeId, 
    setSelectedNodeId, duplicateNode, deleteSelectedEdges, 
    nodeColors, setNodeColor, nodeTextColors, setNodeTextColor,
    exportSelectedNodes, importNodes
  } = useStore();
  
  const { getNodes } = useReactFlow();
  const selectedNodesCount = getNodes().filter(n => n.selected).length;

  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);
  const [isColorSettingsVisible, setIsColorSettingsVisible] = useState(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  
  useEffect(() => {
    if (scenario) {
      fetchScenario(backend, scenario.id);
    }
  }, [scenario, backend, fetchScenario]);

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
    { type: 'iframe', label: '+ iFrame' },
  ];
  
  const visibleNodeButtons = nodeButtons.filter(button => button.type !== 'fixedmenu');

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
                {visibleNodeButtons.map(({ type, label }) => (
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

        {visibleNodeButtons.map(({ type, label }) => (
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
        
        <div className={styles.separator} />
        <button onClick={importNodes} className={styles.sidebarButton} style={{backgroundColor: '#555', color: 'white'}}>
          Import Nodes
        </button>
        <button onClick={exportSelectedNodes} className={styles.sidebarButton} disabled={selectedNodesCount === 0} style={{backgroundColor: '#555', color: 'white'}}>
          Export Nodes ({selectedNodesCount})
        </button>

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
        <SlotDisplay />
        <div className={styles.topRightControls}>
          <div onClick={() => saveScenario(backend, scenario)}>
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
          {/* --- 💡 수정된 부분 시작 --- */}
          <MiniMap nodeColor={(n) => nodeColors[n.type] || '#ddd'} nodeStrokeWidth={3} zoomable pannable />
          {/* --- 💡 수정된 부분 끝 --- */}
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

import { ReactFlowProvider } from 'reactflow';

function FlowWithProvider(props) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}

export default FlowWithProvider;