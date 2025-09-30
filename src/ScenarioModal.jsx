import { useState, useEffect } from 'react';
import styles from './ScenarioModal.module.css';
import useAlert from './hooks/useAlert';

function ScenarioModal({ isOpen, onClose, onSave, scenario }) {
  const [name, setName] = useState('');
  const [job, setJob] = useState('Batch'); // Default job type
  const { showAlert } = useAlert();

  const isEditMode = !!scenario;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setName(scenario.name || '');
        setJob(scenario.job || 'Batch');
      } else {
        setName('');
        setJob('Batch');
      }
    }
  }, [isOpen, scenario, isEditMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), job });
    } else {
      showAlert('Please enter a scenario name.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? 'Edit Scenario' : 'Create New Scenario'}</h2>
        <p>{isEditMode ? 'Edit the name and job type of your scenario.' : 'Enter a name and select a job type for your new scenario.'}</p>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Scenario Name"
            autoFocus
          />
          <label className={styles.label}>Job Type</label>
          <select
            className={styles.input}
            value={job}
            onChange={(e) => setJob(e.target.value)}
          >
            <option value="Batch">Batch</option>
            <option value="Process">Process</option>
            <option value="Long Transaction">Long Transaction</option>
          </select>
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton}>
              {isEditMode ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScenarioModal;