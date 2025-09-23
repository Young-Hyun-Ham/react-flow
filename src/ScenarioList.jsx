import { useState, useEffect } from 'react';
import * as backendService from './backendService';
import useAlert from './hooks/useAlert';

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
  scenarioName: {
    flexGrow: 1,
    textAlign: 'left',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '5px 10px',
    fontSize: '0.8rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  button: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '1rem',
  }
};

function ScenarioList({ backend, onSelect, onAddScenario, scenarios, setScenarios }) {
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    const fetchAndSetScenarios = async () => {
      setLoading(true);
      try {
        const scenarioList = await backendService.fetchScenarios(backend);
        setScenarios(scenarioList);
      } catch (error) {
        console.error("Error fetching scenarios:", error);
        showAlert("Failed to load scenario list.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetScenarios();
  }, [backend, setScenarios]);

  const handleRenameScenario = async (oldScenario) => {
    const newName = prompt("Enter the new scenario name:", oldScenario.name);
    if (newName && newName.trim() && newName !== oldScenario.name) {
      if (scenarios.some(s => s.name === newName)) {
        showAlert("A scenario with that name already exists.");
        return;
      }
      try {
        await backendService.renameScenario(backend, { oldScenario, newName });
        setScenarios(prev => prev.map(s => (s.id === oldScenario.id ? { ...s, name: newName } : s)));
        showAlert("Scenario renamed successfully.");
      } catch (error) {
        console.error("Error renaming scenario:", error);
        showAlert(`Failed to rename scenario: ${error.message}`);
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
      <h1 style={styles.title}>Chatbot Scenario List</h1>
      <ul style={styles.list}>
        {scenarios.map(scenario => (
          <li key={scenario.id} style={styles.listItem}>
            <span
                onClick={() => onSelect(scenario)}
                style={styles.scenarioName}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {scenario.name}
            </span>
            <div style={styles.buttonGroup}>
              <button onClick={() => handleRenameScenario(scenario)} style={styles.actionButton}>Edit</button>
              <button onClick={() => handleDeleteScenario(scenario.id)} style={{...styles.actionButton, color: 'red'}}>Delete</button>
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