import { useState, useEffect } from 'react';
import useStore from './store';
import styles from './NodeController.module.css';

// ElementEditor는 이제 local state를 직접 수정하는 함수를 props로 받습니다.
function ElementEditor({ element, index, onUpdate, onDelete, onGridCellChange }) {
  if (!element) {
    return <p className={styles.placeholder}>편집할 요소를 선택하세요.</p>;
  }

  const handleUpdate = (field, value) => {
    onUpdate(index, { ...element, [field]: value });
  };

  const handleValidationUpdate = (field, value) => {
    const newValidation = { ...element.validation, [field]: value };
    onUpdate(index, { ...element, validation: newValidation });
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
      <div className={styles.formGroup}>
        <label>Grid Content</label>
        <div className={styles.gridContentEditor} style={{ gridTemplateColumns: `repeat(${element.columns || 2}, 1fr)`}}>
          {element.data?.map((cell, idx) => {
            const rowIndex = Math.floor(idx / element.columns);
            const colIndex = idx % element.columns;
            return (
              <textarea
                key={idx}
                value={cell}
                onChange={(e) => onGridCellChange(index, rowIndex, colIndex, e.target.value)}
                className={styles.gridCellEditor}
              />
            );
          })}
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
        <button className={styles.deleteElementButton} onClick={() => onDelete(index)}>삭제</button>
      </div>
    </div>
  );
}


function NodeController() {
  const { selectedNodeId, nodes, updateNodeData, addReply, updateReply, deleteReply } = useStore();
  
  const [localNode, setLocalNode] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  // --- 💡 추가: 변경 여부 상태 ---
  const [isDirty, setIsDirty] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setLocalNode(JSON.parse(JSON.stringify(selectedNode)));
      setIsDirty(false); // 새 노드 선택 시 초기화
    } else {
      setLocalNode(null);
    }
    setSelectedElementId(null);
  }, [selectedNode]);
  
  // --- 💡 추가: localNode 변경 시 isDirty 상태 업데이트 ---
  useEffect(() => {
    if (localNode && selectedNode) {
      // JSON.stringify를 사용한 간단한 깊은 비교
      const hasChanged = JSON.stringify(localNode.data) !== JSON.stringify(selectedNode.data);
      setIsDirty(hasChanged);
    }
  }, [localNode, selectedNode]);
  
  if (!localNode) {
    return (
      <div className={styles.controllerContainer}>
        <div className={styles.mainControls}>
          <h3>컨트롤러</h3>
          <p className={styles.placeholder}>수정할 노드를 선택하세요.</p>
        </div>
      </div>
    );
  }
  
  const handleLocalDataChange = (key, value) => {
    setLocalNode(prev => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };
  
  const handleSaveChanges = () => {
    updateNodeData(localNode.id, localNode.data);
    setIsDirty(false); // 저장 후 초기화
  };

  const localAddElement = (elementType) => {
    setLocalNode(prev => {
        const newNode = { ...prev };
        let newElement;
        const newId = `${elementType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        switch (elementType) {
            case 'input':
              newElement = { id: newId, type: 'input', name: '', label: 'New Input', placeholder: '', validation: { type: 'text' } };
              break;
            case 'date':
              newElement = { id: newId, type: 'date', name: '', label: 'New Date' };
              break;
            case 'grid':
              const rows = 2;
              const columns = 2;
              newElement = {
                id: newId,
                type: 'grid',
                name: '',
                label: 'New Grid',
                rows: rows,
                columns: columns,
                data: Array(rows * columns).fill('')
              };
              break;
            case 'checkbox':
              newElement = { id: newId, type: 'checkbox', name: '', label: 'New Checkbox', options: [] };
              break;
            case 'dropbox':
              newElement = { id: newId, type: 'dropbox', name: '', label: 'New Dropbox', options: [] };
              break;
            default:
              newElement = { id: newId, type: elementType };
          }

        newNode.data.elements = [...(newNode.data.elements || []), newElement];
        return newNode;
    });
  };

  const localUpdateElement = (elementIndex, elementUpdate) => {
    setLocalNode(prev => {
      const newNode = { ...prev };
      const newElements = [...newNode.data.elements];
      newElements[elementIndex] = elementUpdate;
      newNode.data.elements = newElements;
      return newNode;
    });
  };

  const localDeleteElement = (elementIndex) => {
    setLocalNode(prev => {
        const newNode = { ...prev };
        newNode.data.elements = newNode.data.elements.filter((_, i) => i !== elementIndex);
        return newNode;
    });
    setSelectedElementId(null);
  };

  const localMoveElement = (startIndex, endIndex) => {
      setLocalNode(prev => {
        const newNode = { ...prev };
        const newElements = [...newNode.data.elements];
        const [removed] = newElements.splice(startIndex, 1);
        newElements.splice(endIndex, 0, removed);
        newNode.data.elements = newElements;
        return newNode;
      });
  };
  
  const localUpdateGridCell = (elementIndex, rowIndex, colIndex, value) => {
      setLocalNode(prev => {
        const newNode = { ...prev };
        const newElements = JSON.parse(JSON.stringify(newNode.data.elements));
        const gridElement = newElements[elementIndex];
        if (gridElement && gridElement.type === 'grid') {
            const index = rowIndex * gridElement.columns + colIndex;
            gridElement.data[index] = value;
            newNode.data.elements = newElements;
        }
        return newNode;
      });
  };

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dragOver);
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove(styles.dragOver);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);
    if (draggedItemIndex !== null && draggedItemIndex !== index) {
        localMoveElement(draggedItemIndex, index);
    }
    setDraggedItemIndex(null);
  };

  const renderFormControls = () => {
    const { id, data } = localNode;
    const elementTabs = ['input', 'date', 'grid', 'checkbox', 'dropbox'];

    const elements = data.elements || [];
    const selectedElementIndex = elements.findIndex(el => el.id === selectedElementId);
    const selectedElement = selectedElementIndex > -1 ? elements[selectedElementIndex] : null;

    return (
      <>
        <div className={styles.formGroup}>
          <label>Form Title</label>
          <input type="text" value={data.title || ''} onChange={(e) => handleLocalDataChange('title', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Add Element</label>
          <div className={styles.elementTabs}>
            {elementTabs.map(type => (
              <button key={type} onClick={() => localAddElement(type)}>{type}</button>
            ))}
          </div>
        </div>
        <div className={styles.separator} />
        <div className={styles.formGroup}>
          <label>Elements List</label>
          <div className={styles.elementsContainer}>
            {elements.length > 0 ? (
              elements.map((el, index) => (
                <div
                    key={el.id}
                    className={`${styles.elementItem} ${el.id === selectedElementId ? styles.selected : ''}`}
                    onClick={() => setSelectedElementId(el.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                >
                  <div className={styles.elementItemContent}>
                    <span>{el.label || el.type}</span>
                    <span className={styles.elementType}>({el.type})</span>
                  </div>
                  <button
                    className={styles.elementDeleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      localDeleteElement(index);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.placeholder}>추가된 요소가 없습니다.</p>
            )}
          </div>
        </div>
        <div className={styles.separator} />
        {selectedElement && (
            <ElementEditor 
                element={selectedElement} 
                index={selectedElementIndex} 
                onUpdate={localUpdateElement}
                onDelete={localDeleteElement}
                onGridCellChange={localUpdateGridCell}
            />
        )}
      </>
    );
  };

  const renderDefaultControls = () => {
    const { id, type, data } = selectedNode;
    const { updateReply, deleteReply, addReply } = useStore.getState();
    return (
      <>
        <div className={styles.formGroup}>
          <label>Content</label>
          <textarea value={data.content || ''} onChange={(e) => updateNodeData(id, { content: e.target.value })} rows={4} />
        </div>

        {type === 'api' && (
          <div className={styles.formGroup}>
            <label>Slot</label>
            <input type="text" value={data.slot || ''} onChange={(e) => updateNodeData(id, { slot: e.target.value })} />
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
        <h3>타입: {localNode.type}</h3>
        <div className={styles.form}>
          {localNode.type === 'form' ? renderFormControls() : renderDefaultControls()}
        </div>
      </div>
      {localNode.type === 'form' && (
        <div className={styles.controllerActions}>
          {/* --- 💡 수정: disabled 속성 추가 --- */}
          <button onClick={handleSaveChanges} className={styles.saveNodeButton} disabled={!isDirty}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

export default NodeController;