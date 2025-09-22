import { useState } from 'react';
import styles from './ApiTemplateModal.module.css';

function ApiTemplateModal({ isOpen, onClose, onSave, onSelect, templates }) {
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (!templateName.trim()) {
      setError('Please enter a template name.');
      return;
    }
    if (templates.some(t => t.name === templateName.trim())) {
      setError('A template with this name already exists.');
      return;
    }
    onSave(templateName.trim());
    setTemplateName('');
    setError('');
  };

  const handleSelect = (template) => {
    onSelect(template);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h2>API Templates</h2>
        
        <div className={styles.saveSection}>
          <h3>Save Current as Template</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setError('');
              }}
              placeholder="Enter template name"
            />
            <button onClick={handleSave}>Save</button>
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>

        <div className={styles.loadSection}>
          <h3>Load from Template</h3>
          <div className={styles.templateList}>
            {templates.length > 0 ? (
              templates.map((template) => (
                <div key={template.id} className={styles.templateItem}>
                  <span>{template.name}</span>
                  <button onClick={() => handleSelect(template)}>Load</button>
                </div>
              ))
            ) : (
              <p>No saved templates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiTemplateModal;