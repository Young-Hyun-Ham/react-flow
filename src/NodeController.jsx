import { useState, useEffect } from 'react';
import useStore from './store';
import styles from './NodeController.module.css';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


function ElementEditor({ element, index, onUpdate, onDelete, onGridCellChange, onSetDefault, onSaveDefault }) {
  if (!element) {
    return <p className={styles.placeholder}>Please select an element to edit.</p>;
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
    const newOptions = [...(element.options || []), 'New option'];
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
            const rowIndex = Math.floor(idx / (element.columns || 2));
            const colIndex = idx % (element.columns || 2);
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
                placeholder="Option value"
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
        <button className={styles.deleteElementButton} onClick={() => onDelete(index)}>Delete</button>
      </div>
    </div>
  );
}


function NodeController() {
  const { selectedNodeId, nodes, updateNodeData } = useStore();

  const [localNode, setLocalNode] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setLocalNode(JSON.parse(JSON.stringify(selectedNode)));
      setIsDirty(false);
    } else {
      setLocalNode(null);
    }
    setSelectedElementId(null);
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

  const handleLocalDataChange = (key, value) => {
    setLocalNode(prev => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  const handleSaveChanges = () => {
    updateNodeData(localNode.id, localNode.data);
    setIsDirty(false);
  };

  const localAddReply = () => {
    setLocalNode(prev => {
        const newNode = { ...prev };
        const nodeType = newNode.type;
        const newReply = {
            display: nodeType === 'branch' ? 'New condition' : (nodeType === 'fixedmenu' ? 'New menu' : 'New reply'),
            value: `${nodeType === 'branch' ? 'cond' : (nodeType === 'fixedmenu' ? 'menu' : 'val')}_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        };
        const newReplies = [...(newNode.data.replies || []), newReply];
        newNode.data.replies = newReplies;
        return newNode;
    });
  };

  const localUpdateReply = (index, part, value) => {
      setLocalNode(prev => {
          const newNode = { ...prev };
          const newReplies = [...newNode.data.replies];
          newReplies[index] = { ...newReplies[index], [part]: value };
          newNode.data.replies = newReplies;
          return newNode;
      });
  };

  const localDeleteReply = (index) => {
      setLocalNode(prev => {
          const newNode = { ...prev };
          const newReplies = newNode.data.replies.filter((_, i) => i !== index);
          newNode.data.replies = newReplies;
          return newNode;
      });
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
            const gridColumns = gridElement.columns || 2;
            const index = rowIndex * gridColumns + colIndex;
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
    const { data } = localNode;
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
              <p className={styles.placeholder}>No elements added yet.</p>
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
  
  // 💡 --- API 컨트롤 UI --- 💡
  const renderApiControls = () => {
    const { data } = localNode;

    const handleMappingChange = (index, part, value) => {
      const newMapping = [...(data.responseMapping || [])];
      newMapping[index] = { ...newMapping[index], [part]: value };
      handleLocalDataChange('responseMapping', newMapping);
    };

    const addMapping = () => {
      const newMapping = [...(data.responseMapping || []), { path: '', slot: '' }];
      handleLocalDataChange('responseMapping', newMapping);
    };

    const deleteMapping = (index) => {
      const newMapping = (data.responseMapping || []).filter((_, i) => i !== index);
      handleLocalDataChange('responseMapping', newMapping);
    };

    return (
      <>
        <div className={styles.formGroup}>
          <label>Method</label>
          <select value={data.method || 'GET'} onChange={(e) => handleLocalDataChange('method', e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>URL</label>
          <textarea value={data.url || ''} onChange={(e) => handleLocalDataChange('url', e.target.value)} rows={3} />
        </div>
        <div className={styles.formGroup}>
          <label>Headers (JSON)</label>
          <textarea value={data.headers || ''} onChange={(e) => handleLocalDataChange('headers', e.target.value)} rows={4} />
        </div>
        {data.method !== 'GET' && (
          <div className={styles.formGroup}>
            <label>Body (JSON)</label>
            <textarea value={data.body || ''} onChange={(e) => handleLocalDataChange('body', e.target.value)} rows={6} />
          </div>
        )}
        <div className={styles.separator} />
        <div className={styles.formGroup}>
          <label>Response Mapping</label>
          <div className={styles.repliesContainer}>
            {(data.responseMapping || []).map((mapping, index) => (
              <div key={index} className={styles.quickReply}>
                <input
                  className={styles.quickReplyInput}
                  value={mapping.path}
                  onChange={(e) => handleMappingChange(index, 'path', e.target.value)}
                  placeholder="JSON Path (e.g., data.name)"
                />
                <input
                  className={styles.quickReplyInput}
                  value={mapping.slot}
                  onChange={(e) => handleMappingChange(index, 'slot', e.target.value)}
                  placeholder="Slot Name"
                />
                <button onClick={() => deleteMapping(index)} className={styles.deleteReplyButton}>×</button>
              </div>
            ))}
            <button onClick={addMapping} className={styles.addReplyButton}>
              + Add Mapping
            </button>
          </div>
        </div>
      </>
    );
  };


  const renderDefaultControls = () => {
    const { type, data } = localNode;
    return (
      <>
        <div className={styles.formGroup}>
          <label>Content</label>
          <textarea value={data.content || ''} onChange={(e) => handleLocalDataChange('content', e.target.value)} rows={4} />
        </div>

        {type === 'link' && (
          <div className={styles.formGroup}>
            <label>Display Text</label>
            <input type="text" value={data.display || ''} onChange={(e) => handleLocalDataChange('display', e.target.value)} />
          </div>
        )}

        {type === 'slotfilling' && (
          <div className={styles.formGroup}>
            <label>Slot</label>
            <input type="text" value={data.slot || ''} onChange={(e) => handleLocalDataChange('slot', e.target.value)} />
          </div>
        )}

        {(type === 'message' || type === 'slotfilling' || type === 'branch' || type === 'fixedmenu') && (
          <div className={styles.formGroup}>
            <label>{type === 'branch' ? 'Branches' : (type === 'fixedmenu' ? 'Menus' : 'Quick Replies')}</label>
            <div className={styles.repliesContainer}>
              {data.replies?.map((reply, index) => (
                <div key={reply.value || index} className={styles.quickReply}>
                  <input
                    className={styles.quickReplyInput}
                    value={reply.display}
                    onChange={(e) => localUpdateReply(index, 'display', e.target.value)}
                    placeholder="Display text"
                  />
                  {type !== 'branch' && type !== 'fixedmenu' && (
                    <input
                      className={styles.quickReplyInput}
                      value={reply.value}
                      onChange={(e) => localUpdateReply(index, 'value', e.target.value)}
                      placeholder="Actual value"
                    />
                  )}
                  <button onClick={() => localDeleteReply(index)} className={styles.deleteReplyButton}>×</button>
                </div>
              ))}
              <button onClick={() => localAddReply()} className={styles.addReplyButton}>
                {type === 'branch' ? '+ Add Branch' : (type === 'fixedmenu' ? '+ Add Menu' : '+ Add Reply')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const renderContent = () => {
    switch(localNode.type) {
      case 'form':
        return renderFormControls();
      case 'api':
        return renderApiControls();
      default:
        return renderDefaultControls();
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