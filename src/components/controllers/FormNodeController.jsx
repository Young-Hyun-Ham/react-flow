import { useState, useEffect } from 'react';
import styles from '../../NodeController.module.css';
import { createFormElement } from '../../nodeFactory';
import * as backendService from '../../backendService';
import FormTemplateModal from '../../FormTemplateModal';
import useAlert from '../../hooks/useAlert';

// --- 💡 [추가] displayKeys를 문자열로 변환하는 헬퍼 ---
const formatDisplayKeys = (keys) => {
  if (!Array.isArray(keys)) return keys || ''; // 이전 버전(문자열) 호환
  return keys.map(k => {
    if (typeof k === 'string') return k; // 이전 버전(문자열 배열) 호환
    if (k.label && k.label !== k.key) {
      return `${k.key}(${k.label})`;
    }
    return k.key;
  }).join(',');
};

// --- 💡 [추가] 문자열을 displayKeys 객체 배열로 파싱하는 헬퍼 ---
const parseDisplayKeys = (value) => {
  if (!value) return [];
  const regex = /([^,(]+)(?:\(([^)]+)\))?/g; // 'key'와 선택적 '(label)' 매칭
  let match;
  const keys = [];
  
  // 쉼표를 기준으로 먼저 나누고 각 항목을 정규식으로 처리
  value.split(',').forEach(part => {
    part = part.trim();
    if (part) {
      const match = part.match(/([^()]+)(?:\(([^)]+)\))?/);
      if (match) {
        const key = match[1] ? match[1].trim() : '';
        const label = match[2] ? match[2].trim() : key; // 괄호 안 레이블이 없으면 key를 label로 사용
        if (key) {
          keys.push({ key, label });
        }
      }
    }
  });
  
  return keys;
};


// ElementEditor 컴포넌트
function ElementEditor({ element, index, onUpdate, onDelete, onGridCellChange }) {
  const handleInputChange = (field, value) => {
    onUpdate(index, { ...element, [field]: value });
  };

  const handleValidationChange = (field, value) => {
    onUpdate(index, { ...element, validation: { ...element.validation, [field]: value } });
  };

  const handleOptionChange = (optIndex, value) => {
    const newOptions = [...element.options];
    newOptions[optIndex] = value;
    onUpdate(index, { ...element, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(element.options || []), `Option ${ (element.options || []).length + 1 }`];
    onUpdate(index, { ...element, options: newOptions });
  };

  const deleteOption = (optIndex) => {
    const newOptions = element.options.filter((_, i) => i !== optIndex);
    onUpdate(index, { ...element, options: newOptions });
  };

  // --- 💡 [수정] displayKeys 임시 문자열 상태 추가 ---
  const [displayKeysString, setDisplayKeysString] = useState(() => formatDisplayKeys(element.displayKeys));
  
  // element.displayKeys가 외부(템플릿 로드 등)에서 변경될 때 input 값 동기화
  useEffect(() => {
    setDisplayKeysString(formatDisplayKeys(element.displayKeys));
  }, [element.displayKeys]);
  // --- 💡 [수정 끝] ---


  return (
    <div className={styles.elementEditor}>
      <h4>Edit {element.type}</h4>
      <div className={styles.formGroup}>
        <label>Label</label>
        <input type="text" value={element.label || ''} onChange={(e) => handleInputChange('label', e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Name (Slot Key)</label>
        <input type="text" value={element.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
      </div>

      {element.type === 'input' && (
        <>
          {/* --- 💡 수정된 부분 시작 --- */}
          <div className={styles.formGroup}>
            <label>Default Value (Optional)</label>
            <input
              type="text"
              placeholder="Enter default value or {slot_name}"
              value={element.defaultValue || ''}
              onChange={(e) => handleInputChange('defaultValue', e.target.value)}
            />
            <p className={styles.instructionText} style={{ marginTop: '4px', fontSize: '0.75rem' }}>
              Use <code>{'{slotName}'}</code> to reference a slot value, otherwise treated as literal text.
            </p>
          </div>
         {/* --- 💡 수정된 부분 끝 --- */}
          <div className={styles.formGroup}>
            <label>Placeholder</label>
            <input type="text" value={element.placeholder || ''} onChange={(e) => handleInputChange('placeholder', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Validation</label>
            <select value={element.validation?.type || 'text'} onChange={(e) => handleValidationChange('type', e.target.value)}>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="phone number">Phone Number</option>
              <option value="custom">Custom (Regex)</option>
            </select>
          </div>
          {element.validation?.type === 'custom' && (
             <div className={styles.formGroup}>
              <label>Regex</label>
              <input type="text" value={element.validation?.regex || ''} onChange={(e) => handleValidationChange('regex', e.target.value)} />
            </div>
          )}
        </>
      )}

      {(element.type === 'checkbox' || element.type === 'dropbox') && (
        <>
          {element.type === 'dropbox' && (
            <div className={styles.formGroup}>
              <label>Options Slot</label>
              <input
                type="text"
                placeholder="Bind to array in slot"
                value={element.optionsSlot || ''}
                onChange={(e) => handleInputChange('optionsSlot', e.target.value)}
              />
            </div>
          )}
          <div className={styles.formGroup}>
            <label>Options (Fallback)</label>
            <div className={styles.repliesContainer}>
              {(element.options || []).map((opt, i) => (
                <div key={i} className={styles.quickReply}>
                  <input className={styles.quickReplyInput} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} disabled={!!element.optionsSlot} />
                  <button onClick={() => deleteOption(i)} className={styles.deleteReplyButton} disabled={!!element.optionsSlot}>×</button>
                </div>
              ))}
              <button onClick={addOption} className={styles.addReplyButton} disabled={!!element.optionsSlot}>+ Add Option</button>
            </div>
          </div>
        </>
      )}

      {element.type === 'grid' && (
        <>
          <div className={styles.formGroup}>
            <label>Data Slot</label>
            <input
              type="text"
              placeholder="Bind to array in slot"
              value={element.optionsSlot || ''}
              onChange={(e) => handleInputChange('optionsSlot', e.target.value)}
            />
          </div>
          {element.optionsSlot && (
            <>
                {/* --- 💡 [수정] Display Labels 입력 필드 로직 변경 --- */}
                <div className={styles.formGroup}>
                    <label>Display Labels (comma-separated)</label>
                    <input
                        type="text"
                        placeholder="e.g., name(My Name),email"
                        value={displayKeysString}
                        onChange={(e) => {
                            // onChange에서는 임시 문자열 상태만 업데이트
                            setDisplayKeysString(e.target.value);
                        }}
                        onBlur={(e) => {
                            // onBlur 시점에 파싱하여 실제 데이터 업데이트
                            handleInputChange('displayKeys', parseDisplayKeys(e.target.value));
                        }}
                    />
                    <p className={styles.instructionText} style={{marginTop: '4px', fontSize: '0.75rem'}}>
                        Use <code>key(Label)</code> syntax. If <code>(Label)</code> is omitted, the key will be used as the label.
                    </p>
                </div>
                {/* --- 💡 [수정 끝] --- */}
                <div className={styles.formGroup}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={element.hideNullColumns || false}
                            onChange={(e) => handleInputChange('hideNullColumns', e.target.checked)}
                        />
                        Hide Columns with Null Values
                    </label>
                </div>
            </>
          )}
          {!element.optionsSlot && (
            <>
              <div className={styles.gridControls}>
                <div className={styles.formGroup}>
                  <label>Rows</label>
                  <input type="number" value={element.rows || 2} onChange={(e) => handleInputChange('rows', parseInt(e.target.value) || 1)} />
                </div>
                 <div className={styles.formGroup}>
                  <label>Columns</label>
                  <input type="number" value={element.columns || 2} onChange={(e) => handleInputChange('columns', parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Grid Content (Fallback)</label>
                <div className={styles.gridContentEditor} style={{ gridTemplateColumns: `repeat(${element.columns || 2}, 1fr)`}}>
                  {Array.from({ length: (element.rows || 2) * (element.columns || 2) }).map((_, i) => {
                    const rowIndex = Math.floor(i / (element.columns || 2));
                    const colIndex = i % (element.columns || 2);
                    return (
                       <textarea
                        key={i}
                        className={styles.gridCellEditor}
                        value={element.data?.[i] || ''}
                        onChange={(e) => onGridCellChange(index, rowIndex, colIndex, e.target.value)}
                      />
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className={styles.editorActions}>
        <button className={styles.deleteElementButton} onClick={() => onDelete(index)}>Delete Element</button>
      </div>
    </div>
  );
}

function FormNodeController({ localNode, setLocalNode }) {
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [formTemplates, setFormTemplates] = useState([]);
    const { showAlert, showConfirm } = useAlert();

    useEffect(() => {
        const fetchTemplates = async () => {
          try {
            const templates = await backendService.fetchFormTemplates();
            setFormTemplates(templates);
          } catch (error) {
            console.error("Failed to fetch form templates:", error);
          }
        };
        fetchTemplates();
    }, []);

    const handleLocalDataChange = (key, value) => {
        setLocalNode(prev => ({
          ...prev,
          data: { ...prev.data, [key]: value },
        }));
    };

    const localAddElement = (elementType) => {
      const newElement = createFormElement(elementType);
      setLocalNode(prev => ({
        ...prev,
        data: {
          ...prev.data,
          elements: [...(prev.data.elements || []), newElement]
        }
      }));
    };

    const localUpdateElement = (elementIndex, elementUpdate) => {
      setLocalNode(prev => {
        const newElements = [...prev.data.elements];
        newElements[elementIndex] = { ...newElements[elementIndex], ...elementUpdate };
        return {
          ...prev,
          data: { ...prev.data, elements: newElements }
        };
      });
    };

    const localDeleteElement = (elementIndex) => {
      setLocalNode(prev => ({
        ...prev,
        data: {
          ...prev.data,
          elements: prev.data.elements.filter((_, i) => i !== elementIndex)
        }
      }));
    };

    const localMoveElement = (startIndex, endIndex) => {
        setLocalNode(prev => {
            const newElements = [...prev.data.elements];
            const [removed] = newElements.splice(startIndex, 1);
            newElements.splice(endIndex, 0, removed);
            return {
              ...prev,
              data: { ...prev.data, elements: newElements }
            };
        });
    };

    const localUpdateGridCell = (elementIndex, rowIndex, colIndex, value) => {
        setLocalNode(prev => {
            const newElements = JSON.parse(JSON.stringify(prev.data.elements));
            const gridElement = newElements[elementIndex];
            if (gridElement && gridElement.type === 'grid') {
              const index = rowIndex * gridElement.columns + colIndex;
              gridElement.data[index] = value;
              return {
                ...prev,
                data: { ...prev.data, elements: newElements }
              };
            }
            return prev;
        });
    };

    const handleSaveTemplate = async (templateName) => {
        const templateData = {
            name: templateName,
            title: localNode.data.title,
            elements: localNode.data.elements || [],
        };
        try {
            const savedTemplate = await backendService.saveFormTemplate(templateData);
            setFormTemplates(prev => [...prev, savedTemplate]);
            setIsTemplateModalOpen(false);
            await showAlert("Form template saved successfully!");
        } catch (error) {
            console.error("Failed to save form template:", error);
            await showAlert("Failed to save template.");
        }
    };

    const handleLoadTemplate = (template) => {
        setLocalNode(prev => ({
            ...prev,
            data: {
                ...prev.data,
                title: template.title,
                elements: template.elements, // 템플릿 로드 시 displayKeys가 객체 배열로 올바르게 로드됨
            },
        }));
        setSelectedElementId(null); // 템플릿 로드 후 선택 초기화
        setIsTemplateModalOpen(false);
    };

    const handleDeleteTemplate = async (templateId) => {
        const confirmed = await showConfirm("Are you sure you want to delete this form template?");
        if (confirmed) {
            try {
                await backendService.deleteFormTemplate(templateId);
                setFormTemplates(prev => prev.filter(t => t.id !== templateId));
            } catch (error) {
                console.error("Failed to delete form template:", error);
                await showAlert("Failed to delete template.");
            }
        }
    };


    const handleDragStart = (e, index) => {
      setDraggedItemIndex(index);
    };

    const handleDragOver = (e, index) => {
      e.preventDefault();
    };

    const handleDragLeave = (e) => {
    };

    const handleDrop = (e, index) => {
      if (draggedItemIndex === null || draggedItemIndex === index) return;
      localMoveElement(draggedItemIndex, index);
      setDraggedItemIndex(null);
    };

    const { data } = localNode;
    const elementTabs = ['input', 'date', 'grid', 'checkbox', 'dropbox'];
    const elements = data.elements || [];
    const selectedElementIndex = elements.findIndex(el => el.id === selectedElementId);
    const selectedElement = selectedElementIndex > -1 ? elements[selectedElementIndex] : null;

  return (
    <>
      <FormTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
        onSelect={handleLoadTemplate}
        onDelete={handleDeleteTemplate}
        templates={formTemplates}
      />
      <div className={styles.templateActions}>
        <button onClick={() => setIsTemplateModalOpen(true)}>Templates</button>
      </div>
      <div className={styles.separator} />

      <div className={styles.formGroup}>
        <label>Form Title</label>
        <input type="text" value={data.title || ''} onChange={(e) => handleLocalDataChange('title', e.target.value)} />
      </div>
      
      {/* <<< [수정] 엑셀 업로드 체크박스 >>> */}
      <div className={styles.formGroup} style={{paddingTop: 5, paddingBottom: 5}}>
        <label 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.85rem',
            color: '#555'
          }}
        >
            <input
                type="checkbox"
                checked={data.enableExcelUpload || false}
                onChange={(e) => handleLocalDataChange('enableExcelUpload', e.target.checked)}
                style={{ width: '16px', height: '16px', margin: 0, flexShrink: 0, accentColor: '#3498db' }}
            />
            Enable Excel Upload Button
        </label>
      </div>
      {/* <<< [수정 끝] >>> */}

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
                    if (el.id === selectedElementId) { // 💡 [추가] 삭제 시 선택 해제
                      setSelectedElementId(null);
                    }
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
              key={selectedElement.id} // 💡 [추가] key를 추가하여 element 선택 변경 시 Editor 강제 리마운트
              element={selectedElement}
              index={selectedElementIndex}
              onUpdate={localUpdateElement}
              onDelete={(index) => {
                localDeleteElement(index);
                setSelectedElementId(null); // 💡 [추가] 삭제 시 선택 해제
              }}
              onGridCellChange={localUpdateGridCell}
          />
      )}
    </>
  );
}

export default FormNodeController;