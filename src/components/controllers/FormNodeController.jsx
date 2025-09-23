import { useState } from 'react';
import styles from '../../NodeController.module.css';

// ElementEditor 컴포넌트 (ApiNodeController.jsx에서 가져와도 되고, 별도 파일로 분리해도 좋습니다)
// ...

function FormNodeController({ localNode, setLocalNode }) {
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    const handleLocalDataChange = (key, value) => {
        setLocalNode(prev => ({
          ...prev,
          data: { ...prev.data, [key]: value },
        }));
    };

    const localAddElement = (elementType) => {
      // ... (기존 localAddElement 로직)
    };
    
    const localUpdateElement = (elementIndex, elementUpdate) => {
      // ... (기존 localUpdateElement 로직)
    };
    
    const localDeleteElement = (elementIndex) => {
      // ... (기존 localDeleteElement 로직)
    };

    const localMoveElement = (startIndex, endIndex) => {
        // ... (기존 localMoveElement 로직)
    };
    
    const localUpdateGridCell = (elementIndex, rowIndex, colIndex, value) => {
        // ... (기존 localUpdateGridCell 로직)
    };

    const handleDragStart = (e, index) => {
      // ... (기존 handleDragStart 로직)
    };
    
    const handleDragOver = (e, index) => {
      // ... (기존 handleDragOver 로직)
    };
    
    const handleDragLeave = (e) => {
      // ... (기존 handleDragLeave 로직)
    };
    
    const handleDrop = (e, index) => {
      // ... (기존 handleDrop 로직)
    };
  
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
}

export default FormNodeController;