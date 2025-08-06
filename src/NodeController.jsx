import useStore from './store';
import styles from './NodeController.module.css';

function NodeController() {
  const { 
    selectedNodeId, 
    nodes, 
    updateNodeData, 
    addReply, 
    updateReply, 
    deleteReply 
  } = useStore();
  
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className={styles.controllerContainer}>
        <h3>컨트롤러</h3>
        <p className={styles.placeholder}>수정할 노드를 선택하세요.</p>
      </div>
    );
  }

  const handleDataChange = (key, value) => {
    updateNodeData(selectedNode.id, { [key]: value });
  };

  const renderControls = () => {
    const { id, type, data } = selectedNode;
    return (
      <>
        {/* --- 💡 수정된 부분: ID 필드 제거 --- */}
        <div className={styles.formGroup}>
          <label>Content</label>
          <textarea
            value={data.content || ''}
            onChange={(e) => handleDataChange('content', e.target.value)}
            rows={4}
          />
        </div>
        {type === 'slotFilling' && (
          <div className={styles.formGroup}>
            <label>Slot</label>
            <input
              type="text"
              value={data.slot || ''}
              onChange={(e) => handleDataChange('slot', e.target.value)}
            />
          </div>
        )}
        {(type === 'text' || type === 'slotFilling') && (
          <div className={styles.formGroup}>
            <label>Quick Replies</label>
            <div className={styles.repliesContainer}>
              {data.replies?.map((reply, index) => (
                <div key={index} className={styles.quickReply}>
                  <input
                    className={styles.quickReplyInput}
                    value={reply.display}
                    onChange={(e) => updateReply(id, index, 'display', e.target.value)}
                    placeholder="표시될 텍스트"
                  />
                  <input
                    className={styles.quickReplyInput}
                    value={reply.value}
                    onChange={(e) => updateReply(id, index, 'value', e.target.value)}
                    placeholder="실제 값"
                  />
                  <button onClick={() => deleteReply(id, index)} className={styles.deleteReplyButton}>×</button>
                </div>
              ))}
              <button onClick={() => addReply(id)} className={styles.addReplyButton}>+ Add Reply</button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.controllerContainer}>
      <h3>타입: {selectedNode.type}</h3>
      <div className={styles.form}>
        {renderControls()}
      </div>
    </div>
  );
}

export default NodeController;
