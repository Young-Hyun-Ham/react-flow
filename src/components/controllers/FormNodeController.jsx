import { useState, useEffect } from 'react';
import styles from '../../NodeController.module.css';
import { createFormElement } from '../../nodeFactory';
import * as backendService from '../../backendService';
import FormTemplateModal from '../../FormTemplateModal';
import useAlert from '../../hooks/useAlert';


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
            <label>Grid Content</label>
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
                elements: template.elements,
            },
        }));
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