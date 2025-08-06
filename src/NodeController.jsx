import useStore from './store';
import styles from './NodeController.module.css';

function NodeController() {
  const { 
    selectedNodeId, 
    nodes, 
    updateNodeData, 
    addReply, 
    updateReply, 
    deleteReply,
    addElement,
    updateElement,
    deleteElement
  } = useStore();
  
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className={styles.controllerContainer}>
        <div className={styles.mainControls}>
          <h3>컨트롤러</h3>
          <p className={styles.placeholder}>수정할 노드를 선택하세요.</p>
        </div>
      </div>
    );
  }

  const handleDataChange = (key, value) => {
    updateNodeData(selectedNode.id, { [key]: value });
  };

  const renderElementControls = (element, index) => {
    switch (element.type) {
      case 'image':
        return (
          <div className={styles.elementDetails}>
            <input 
              type="text" 
              placeholder="Image URL" 
              value={element.src || ''}
              onChange={(e) => updateElement(selectedNode.id, index, { src: e.target.value })}
            />
            <input 
              type="text" 
              placeholder="Alt Text" 
              value={element.alt || ''}
              onChange={(e) => updateElement(selectedNode.id, index, { alt: e.target.value })}
            />
          </div>
        );
      case 'grid':
        return (
          <div className={styles.elementDetails}>
            <label>Columns: {element.columns}</label>
            <input 
              type="range" 
              min="1" 
              max="4" 
              value={element.columns || 2}
              onChange={(e) => updateElement(selectedNode.id, index, { columns: parseInt(e.target.value, 10) })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderControls = () => {
    const { id, type, data } = selectedNode;
    return (
      <>
        {/* Text, SlotFilling 노드를 위한 Content 필드 (Form 노드에서는 숨김) */}
        {type !== 'form' && (
          <div className={styles.formGroup}>
            <label>Content</label>
            <textarea
              value={data.content || ''}
              onChange={(e) => handleDataChange('content', e.target.value)}
              rows={4}
            />
          </div>
        )}
        
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
        
        {type === 'form' && (
          <>
            <div className={styles.formGroup}>
              <label>Form Title</label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
              />
            </div>
            {/* --- 💡 추가된 부분: 데이터 소스 선택 --- */}
            <div className={styles.formGroup}>
              <label>Data Source</label>
              <div className={styles.dataSourceSelector}>
                <label>
                  <input type="radio" name={`dataSourceType-${id}`} value="json" checked={data.dataSourceType === 'json'} onChange={(e) => handleDataChange('dataSourceType', e.target.value)} />
                  JSON
                </label>
                <label>
                  <input type="radio" name={`dataSourceType-${id}`} value="api" checked={data.dataSourceType === 'api'} onChange={(e) => handleDataChange('dataSourceType', e.target.value)} />
                  API
                </label>
              </div>
              {data.dataSourceType === 'json' ? (
                <textarea
                  placeholder="Enter JSON data here..."
                  value={data.dataSource || ''}
                  onChange={(e) => handleDataChange('dataSource', e.target.value)}
                  rows={5}
                />
              ) : (
                <input
                  type="text"
                  placeholder="Enter API endpoint URL..."
                  value={data.dataSource || ''}
                  onChange={(e) => handleDataChange('dataSource', e.target.value)}
                />
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Form Elements</label>
              <div className={styles.elementsContainer}>
                {data.elements?.map((element, index) => (
                  <div key={element.id} className={styles.elementControl}>
                    <div className={styles.elementHeader}>
                      <strong>{element.type}</strong>
                      <button onClick={() => deleteElement(id, index)} className={styles.deleteElementButton}>×</button>
                    </div>
                    {renderElementControls(element, index)}
                  </div>
                ))}
                <div className={styles.addElementButtons}>
                  <button onClick={() => addElement(id, 'image')}>+ Image</button>
                  <button onClick={() => addElement(id, 'grid')}>+ Grid</button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className={styles.controllerContainer}>
      <div className={styles.mainControls}>
        <h3>타입: {selectedNode.type}</h3>
        <div className={styles.form}>
          {renderControls()}
        </div>
      </div>
      <div className={styles.separator} />
      <div className={styles.advancedControls}>
        <h3>Advanced</h3>
        <div className={styles.formGroup}>
          <label>API Endpoint (Optional)</label>
          <input type="text" placeholder="e.g., https://api.example.com/data" />
        </div>
         <div className={styles.formGroup}>
          <label>Additional Config (JSON)</label>
          <textarea rows={3} placeholder='{ "key": "value" }'></textarea>
        </div>
      </div>
    </div>
  );
}

export default NodeController;
