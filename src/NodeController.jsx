import { useState, useEffect } from 'react';
import useStore from './store';
import styles from './NodeController.module.css';
import ApiNodeController from './components/controllers/ApiNodeController';
import FormNodeController from './components/controllers/FormNodeController';
import LlmNodeController from './components/controllers/LlmNodeController';
import ToastNodeController from './components/controllers/ToastNodeController';
import IframeNodeController from './components/controllers/IframeNodeController';
import MessageNodeController from './components/controllers/MessageNodeController';
import SlotFillingNodeController from './components/controllers/SlotFillingNodeController';
import BranchNodeController from './components/controllers/BranchNodeController';
import LinkNodeController from './components/controllers/LinkNodeController';
import FixedMenuNodeController from './components/controllers/FixedMenuNodeController';

function NodeController() {
  const { selectedNodeId, nodes, updateNodeData } = useStore();
  const [localNode, setLocalNode] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setLocalNode(JSON.parse(JSON.stringify(selectedNode)));
      setIsDirty(false);
    } else {
      setLocalNode(null);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (localNode && selectedNode) {
      const hasChanged = JSON.stringify(localNode.data) !== JSON.stringify(selectedNode.data);
      setIsDirty(hasChanged);
    }
  }, [localNode, selectedNode]);

  if (!localNode) {
    return (
      <div className={styles.controllerContainer}>
        <div className={styles.mainControls}>
          <h3>Controller</h3>
          <p className={styles.placeholder}>Please select a node to edit.</p>
        </div>
      </div>
    );
  }

  const handleSaveChanges = () => {
    updateNodeData(localNode.id, localNode.data);
    setIsDirty(false);
  };

  const renderContent = () => {
    const commonProps = { localNode, setLocalNode };
    switch(localNode.type) {
      case 'message':
        return <MessageNodeController {...commonProps} />;
      case 'slotfilling':
        return <SlotFillingNodeController {...commonProps} />;
      case 'branch':
        return <BranchNodeController {...commonProps} />;
      case 'link':
        return <LinkNodeController {...commonProps} />;
      case 'fixedmenu':
        return <FixedMenuNodeController {...commonProps} />;
      case 'form':
        return <FormNodeController {...commonProps} />;
      case 'api':
        return <ApiNodeController {...commonProps} />;
      case 'llm':
        return <LlmNodeController {...commonProps} />;
      case 'toast':
        return <ToastNodeController {...commonProps} />;
      case 'iframe':
        return <IframeNodeController {...commonProps} />;
      default:
        return <p className={styles.placeholder}>This node type has no editable properties.</p>;
    }
  };

  return (
    <div className={styles.controllerContainer}>
      <div className={styles.mainControls}>
        <h3>Type: {localNode.type}</h3>
        <div className={styles.form}>
          {renderContent()}
        </div>
      </div>
      <div className={styles.controllerActions}>
        <button onClick={handleSaveChanges} className={styles.saveNodeButton} disabled={!isDirty}>
          Save Changes {isDirty && ' *'}
        </button>
      </div>
    </div>
  );
}

export default NodeController;