import { useState, useEffect } from 'react';
import useStore from './store';
import styles from './NodeController.module.css';

function ElementEditor({ nodeId, element, index }) {
  const { updateElement, deleteElement } = useStore();

  if (!element) {
    return <p className={styles.placeholder}>편집할 요소를 선택하세요.</p>;
  }

  const handleUpdate = (field, value) => {
    updateElement(nodeId, index, { ...element, [field]: value });
  };

  const handleValidationUpdate = (field, value) => {
    const newValidation = { ...element.validation, [field]: value };
    updateElement(nodeId, index, { ...element, validation: newValidation });
  };

  const handleOptionChange = (optIndex, optValue) => {
    const newOptions = [...(element.options || [])];
    newOptions[optIndex] = optValue;
    handleUpdate('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(element.options || []), '새 옵션'];
    handleUpdate('options', newOptions);
  };

  const deleteOption = (optIndex) => {
    const newOptions = (element.options || []).filter((_, i) => i !== optIndex);
    handleUpdate('options', newOptions);
  };
  
  const renderSharedControls = () => (
    <>
      <div className={styles.formGroup}>
        <label>Name</label>
        <input type="text" value={element.name || ''} onChange={(e) => handleUpdate('name', e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Label</label>
        <input type="text" value={element.label || ''} onChange={(e) => handleUpdate('label', e.target.value)} />
      </div>
    </>
  );

  const renderInputControls = () => (
    <>
      {renderSharedControls()}
      <div className={styles.formGroup}>
        <label>Placeholder</label>
        <input type="text" value={element.placeholder || ''} onChange={(e) => handleUpdate('placeholder', e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Validation Type</label>
        <select value={element.validation?.type || 'text'} onChange={(e) => handleValidationUpdate('type', e.target.value)}>
          <option value="text">Text</option>
          <option value="email">Email</option>
          <option value="phone number">Phone Number</option>
          <option value="custom">Custom (Regex)</option>
        </select>
      </div>
      {element.validation?.type === 'custom' && (
        <div className={styles.formGroup}>
          <label>Regex</label>
          <input type="text" value={element.validation.regex || ''} onChange={(e) => handleValidationUpdate('regex', e.target.value)} />
        </div>
      )}
    </>
  );

  const renderDateControls = () => (
     <>
      {renderSharedControls()}
      <div className={styles.formGroup}>
        <label>Validation Type</label>
        <select value={element.validation?.type || 'date'} onChange={(e) => handleValidationUpdate('type', e.target.value)}>
          <option value="date">Default Date</option>
        </select>
      </div>
    </>
  );

  // --- 💡 수정된 부분: Grid 컨트롤 ---
  const renderGridControls = () => (
    <>
        {renderSharedControls()}
        <div className={styles.gridControls}>
            <div className={styles.formGroup}>
                <label>Rows</label>
                <input type="number" min="1" max="10" value={element.rows || 2} onChange={(e) => handleUpdate('rows', parseInt(e.target.value, 10))} />
            </div>
            <div className={styles.formGroup}>
                <label>Columns</label>
                <input type="number" min="1" max="5" value={element.columns || 2} onChange={(e) => handleUpdate('columns', parseInt(e.target.value, 10))} />
            </div>
        </div>
    </>
  );

  const renderOptionsControls = () => (
    <>
      {renderSharedControls()}
      <div className={styles.formGroup}>
        <label>Options</label>
        <div className={styles.repliesContainer}>
          {(element.options || []).map((option, optIndex) => (
            <div key={optIndex} className={styles.quickReply}>
              <input
                className={styles.quickReplyInput}
                value={option}
                onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                placeholder="옵션 값"
              />
              <button onClick={() => deleteOption(optIndex)} className={styles.deleteReplyButton}>×</button>
            </div>
          ))}
          <button onClick={addOption} className={styles.addReplyButton}>+ Add Option</button>
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.elementEditor}>
      <h4>Edit {element.type}</h4>
      {element.type === 'input' && renderInputControls()}
      {element.type === 'date' && renderDateControls()}
      {element.type === 'grid' && renderGridControls()}
      {(element.type === 'checkbox' || element.type === 'dropbox') && renderOptionsControls()}
      <div className={styles.editorActions}>
        <button className={styles.deleteElementButton} onClick={() => deleteElement(nodeId, index)}>삭제</button>
        <button className={styles.saveElementButton}>저장</button>
      </div>
    </div>
  );
}


function NodeController() {
  const { selectedNodeId, nodes, updateNodeData, addReply, updateReply, deleteReply, addElement } = useStore();
  const [selectedElementId, setSelectedElementId] = useState(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    setSelectedElementId(null);
  }, [selectedNodeId]);


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

  const renderFormControls = () => {
    const { id, data } = selectedNode;
    const elementTabs = ['input', 'date', 'grid', 'checkbox', 'dropbox'];

    const elements = data.elements || [];
    const selectedElementIndex = elements.findIndex(el => el.id === selectedElementId);
    const selectedElement = selectedElementIndex > -1 ? elements[selectedElementIndex] : null;

    return (
      <>
        <div className={styles.formGroup}>
          <label>Form Title</label>
          <input type="text" value={data.title || ''} onChange={(e) => handleDataChange('title', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Add Element</label>
          <div className={styles.elementTabs}>
            {elementTabs.map(type => (
              <button key={type} onClick={() => addElement(id, type)}>{type}</button>
            ))}
          </div>
        </div>
        <div className={styles.separator} />
        <div className={styles.formGroup}>
          <label>Elements List</label>
          <div className={styles.elementsContainer}>
            {elements.length > 0 ? (
              elements.map(el => (
                <div
                  key={el.id}
                  className={`${styles.elementItem} ${el.id === selectedElementId ? styles.selected : ''}`}
                  onClick={() => setSelectedElementId(el.id)}
                >
                  <span>{el.label || el.type}</span>
                  <span>({el.type})</span>
                </div>
              ))
            ) : (
              <p className={styles.placeholder}>추가된 요소가 없습니다.</p>
            )}
          </div>
        </div>
        <div className={styles.separator} />
        <ElementEditor nodeId={id} element={selectedElement} index={selectedElementIndex} />
      </>
    );
  };

  const renderDefaultControls = () => {
    const { id, type, data } = selectedNode;
    return (
      <>
        <div className={styles.formGroup}>
          <label>Content</label>
          <textarea value={data.content || ''} onChange={(e) => handleDataChange('content', e.target.value)} rows={4} />
        </div>

        {type === 'api' && (
          <div className={styles.formGroup}>
            <label>Slot</label>
            <input type="text" value={data.slot || ''} onChange={(e) => handleDataChange('slot', e.target.value)} />
          </div>
        )}

        {(type === 'message' || type === 'api' || type === 'branch') && (
          <div className={styles.formGroup}>
            <label>{type === 'branch' ? 'Branches' : 'Quick Replies'}</label>
            <div className={styles.repliesContainer}>
              {data.replies?.map((reply, index) => (
                <div key={reply.value} className={styles.quickReply}>
                  <input
                    className={styles.quickReplyInput}
                    value={reply.display}
                    onChange={(e) => updateReply(id, index, 'display', e.target.value)}
                    placeholder="표시될 텍스트"
                  />
                  {type !== 'branch' && (
                    <input
                      className={styles.quickReplyInput}
                      value={reply.value}
                      onChange={(e) => updateReply(id, index, 'value', e.target.value)}
                      placeholder="실제 값"
                    />
                  )}
                  <button onClick={() => deleteReply(id, index)} className={styles.deleteReplyButton}>×</button>
                </div>
              ))}
              <button onClick={() => addReply(id)} className={styles.addReplyButton}>
                {type === 'branch' ? '+ Add Branch' : '+ Add Reply'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={styles.controllerContainer}>
      <div className={styles.mainControls}>
        <h3>타입: {selectedNode.type}</h3>
        <div className={styles.form}>
          {selectedNode.type === 'form' ? renderFormControls() : renderDefaultControls()}
        </div>
      </div>
    </div>
  );
}

export default NodeController;