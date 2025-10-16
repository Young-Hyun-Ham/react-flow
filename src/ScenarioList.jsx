import { useState, useEffect } from 'react';
import * as backendService from './backendService';
import useAlert from './hooks/useAlert';
// --- 💡 추가된 부분 시작 ---
import { EditIcon, CloneIcon, DeleteIcon } from './components/Icons';
// --- 💡 추가된 부분 끝 ---

const styles = {
  container: {
    padding: '40px',
    color: '#333',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '20px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    maxWidth: '600px',
    margin: '0 auto',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginBottom: '10px',
    transition: 'background-color 0.2s',
  },
  scenarioInfo: {
    flexGrow: 1,
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  scenarioName: {
    fontWeight: 'bold',
  },
  jobBadge: {
    fontSize: '0.75rem',
    padding: '3px 10px',
    borderRadius: '12px',
    fontWeight: '600',
    border: '1px solid',
  },
  // --- 💡 수정된 부분 시작 ---
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  actionButton: {
    padding: '5px',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, color 0.2s',
    color: '#606770',
  },
  // --- 💡 수정된 부분 끝 ---
  button: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '1rem',
  }
};

// Job 유형에 따라 다른 스타일을 반환하는 함수
const getJobBadgeStyle = (job) => {
    const baseStyle = styles.jobBadge;
    switch (job) {
        case 'Batch':
            return { ...baseStyle, backgroundColor: '#e1eefb', color: '#3f7ff3', borderColor: '#b1d1f8' };
        case 'Process':
            return { ...baseStyle, backgroundColor: '#dff9e8', color: '#27854a', borderColor: '#b3e9c7' };
        case 'Long Transaction':
            return { ...baseStyle, backgroundColor: '#fef3d8', color: '#9d730a', borderColor: '#fce3a2' };
        default:
            return { ...baseStyle, backgroundColor: '#eee', color: '#333', borderColor: '#ddd' };
    }
};

function ScenarioList({ backend, onSelect, onAddScenario, onEditScenario, scenarios, setScenarios }) {
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    const fetchAndSetScenarios = async () => {
      setLoading(true);
      try {
        let scenarioList = await backendService.fetchScenarios(backend);
        // job 속성이 없는 경우 'Process'를 기본값으로 설정
        scenarioList = scenarioList.map(scenario => ({
          ...scenario,
          job: scenario.job || 'Process',
        }));
        setScenarios(scenarioList);
      } catch (error) {
        console.error("Error fetching scenarios:", error);
        showAlert("Failed to load scenario list.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetScenarios();
  }, [backend, setScenarios, showAlert]);

  const handleCloneScenario = async (scenarioToClone) => {
    const newName = prompt(`Enter the new name for the cloned scenario:`, `${scenarioToClone.name}_copy`);
    if (newName && newName.trim()) {
      if (scenarios.some(s => s.name === newName.trim())) {
        showAlert("A scenario with that name already exists.");
        return;
      }
      try {
        const newScenario = await backendService.cloneScenario(backend, {
          scenarioToClone,
          newName: newName.trim(),
        });
        setScenarios(prev => [...prev, newScenario]);
        showAlert(`Scenario '${scenarioToClone.name}' has been cloned to '${newName.trim()}'.`);
      } catch (error) {
        console.error("Error cloning scenario:", error);
        showAlert(`Failed to clone scenario: ${error.message}`);
      }
    }
  };

  const handleDeleteScenario = async (scenarioId) => {
    const confirmed = await showConfirm(`Are you sure you want to delete this scenario?`);
    if (confirmed) {
      try {
        await backendService.deleteScenario(backend, { scenarioId });
        setScenarios(prev => prev.filter(s => s.id !== scenarioId));
        showAlert("Scenario deleted successfully.");
      } catch (error) {
        console.error("Error deleting scenario:", error);
        showAlert(`Failed to delete scenario: ${error.message}`);
      }
    }
  };

  if (loading) {
    return <div>Loading scenarios...</div>;
  }

  return (
    <div style={styles.container}>
      <ul style={styles.list}>
        {scenarios.map(scenario => (
          <li key={scenario.id} style={styles.listItem}>
            <div
                style={styles.scenarioInfo}
                onClick={() => onSelect(scenario)}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              <span style={styles.scenarioName}>{scenario.name}</span>
              <span style={getJobBadgeStyle(scenario.job)}>{scenario.job}</span>
            </div>
            {/* --- 💡 수정된 부분 시작 --- */}
            <div style={styles.buttonGroup}>
                <button
                    onClick={() => onEditScenario(scenario)}
                    style={styles.actionButton}
                    title="Edit"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#343a40'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#606770'; }}
                >
                    <EditIcon />
                </button>
                <button
                    onClick={() => handleCloneScenario(scenario)}
                    style={{...styles.actionButton}}
                    title="Clone"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#3498db'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#606770'; }}
                >
                    <CloneIcon />
                </button>
                <button
                    onClick={() => handleDeleteScenario(scenario.id)}
                    style={styles.actionButton}
                    title="Delete"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#e74c3c'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#606770'; }}
                >
                    <DeleteIcon />
                </button>
            </div>
            {/* --- 💡 수정된 부분 끝 --- */}
          </li>
        ))}
      </ul>
      <button onClick={onAddScenario} style={styles.button}>
        + Add New Scenario
      </button>
    </div>
  );
}

export default ScenarioList;