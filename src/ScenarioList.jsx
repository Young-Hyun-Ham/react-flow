import { useState, useEffect } from 'react';
import * as backendService from './backendService';
import useAlert from './hooks/useAlert';
import { EditIcon, CloneIcon, DeleteIcon } from './components/Icons';

const styles = {
  container: {
    padding: '40px',
    color: '#333',
    textAlign: 'center',
  },
  // --- New styles start ---
  listHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    maxWidth: '600px',
    margin: '0 auto 20px',
  },
  filterSwitch: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
  },
  // --- New styles end ---
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
  },
  scenarioName: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  jobBadge: {
    fontSize: '0.75rem',
    padding: '3px 10px',
    borderRadius: '12px',
    fontWeight: '600',
    border: '1px solid',
  },
  metaInfo: {
    fontSize: '0.8rem',
    color: '#606770',
  },
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
  button: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '1rem',
  }
};

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

function ScenarioList({ backend, onSelect, onAddScenario, onEditScenario, scenarios, setScenarios, user }) {
  const [loading, setLoading] = useState(true);
  const [showMyScenariosOnly, setShowMyScenariosOnly] = useState(false);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    const fetchAndSetScenarios = async () => {
      setLoading(true);
      try {
        let scenarioList = await backendService.fetchScenarios(backend);
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

    if (user) {
        fetchAndSetScenarios();
    }
  }, [backend, setScenarios, showAlert, user]);

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
          user,
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

  const filteredScenarios = showMyScenariosOnly
    ? scenarios.filter(s => s.authorId === user.uid || s.updatedById === user.uid)
    : scenarios;

  if (loading) {
    return <div>Loading scenarios...</div>;
  }

  return (
    <div style={styles.container}>
        <div style={styles.listHeader}>
            <div style={styles.filterSwitch}>
                <label className="switch">
                    <input type="checkbox" checked={showMyScenariosOnly} onChange={() => setShowMyScenariosOnly(!showMyScenariosOnly)} />
                    <span className="slider round"></span>
                </label>
                <span>Show my scenarios only</span>
            </div>
        </div>
      <ul style={styles.list}>
        {filteredScenarios.map(scenario => (
          <li key={scenario.id} style={styles.listItem}>
            <div
                style={styles.scenarioInfo}
                onClick={() => onSelect(scenario)}
            >
                <div>
                    <div style={styles.scenarioName}>
                      <span>{scenario.name}</span>
                      <span style={getJobBadgeStyle(scenario.job)}>{scenario.job}</span>
                    </div>
                    <div style={styles.metaInfo}>
                        Last updated by {scenario.updatedBy || scenario.authorName || 'N/A'} 
                        {' on '}
                        {scenario.updatedAt ? new Date(scenario.updatedAt).toLocaleString() : (scenario.createdAt ? new Date(scenario.createdAt).toLocaleString() : 'N/A')}
                    </div>
                </div>
            </div>
            <div style={styles.buttonGroup}>
                <button
                    onClick={(e) => { e.stopPropagation(); onEditScenario(scenario); }}
                    style={styles.actionButton}
                    title="Edit"
                >
                    <EditIcon />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleCloneScenario(scenario); }}
                    style={{...styles.actionButton}}
                    title="Clone"
                >
                    <CloneIcon />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteScenario(scenario.id); }}
                    style={styles.actionButton}
                    title="Delete"
                >
                    <DeleteIcon />
                </button>
            </div>
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