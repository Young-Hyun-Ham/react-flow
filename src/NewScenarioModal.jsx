import { useState } from 'react';
import styles from './NewScenarioModal.module.css';
import useAlert from './hooks/useAlert';

function NewScenarioModal({ isOpen, onClose, onCreate }) {
  const [scenarioName, setScenarioName] = useState('');
  const { showAlert } = useAlert();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (scenarioName.trim()) {
      onCreate(scenarioName.trim());
      setScenarioName(''); // 입력 필드 초기화
    } else {
      showAlert('Please enter a scenario name.');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Create New Scenario</h2>
        <p>Enter a name for your new scenario.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.input}
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Scenario Name"
            autoFocus
          />
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewScenarioModal;