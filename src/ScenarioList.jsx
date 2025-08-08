import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// Simple style object
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
    margin: 0,
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

function ScenarioList({ onSelect }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScenarios = async () => {
    try {
      const scenariosCollection = collection(db, 'scenarios');
      const querySnapshot = await getDocs(scenariosCollection);
      const scenarioIds = querySnapshot.docs.map(doc => doc.id);
      setScenarios(scenarioIds);
    } catch (error) {
      console.error("Error fetching scenarios: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleAddScenario = async () => {
    const newScenarioName = prompt("Enter the name of the new scenario:");
    if (newScenarioName) {
      const newScenarioRef = doc(db, "scenarios", newScenarioName);
      try {
        await setDoc(newScenarioRef, { nodes: [], edges: [] });
        setScenarios(prev => [...prev, newScenarioName]);
        alert(`Scenario '${newScenarioName}' has been created.`);
      } catch (error) {
        console.error("Error creating new scenario: ", error);
        alert("Failed to create scenario.");
      }
    }
  };

  // --- 💡 Added part: Scenario rename function ---
  const handleRenameScenario = async (oldId) => {
    const newId = prompt("Enter the new scenario name:", oldId);
    if (newId && newId !== oldId) {
      const oldDocRef = doc(db, "scenarios", oldId);
      const newDocRef = doc(db, "scenarios", newId);

      try {
        const oldDocSnap = await getDoc(oldDocRef);
        if (oldDocSnap.exists()) {
          // Use batch write to handle multiple operations atomically
          const batch = writeBatch(db);
          batch.set(newDocRef, oldDocSnap.data()); // Create new document
          batch.delete(oldDocRef); // Delete existing document
          await batch.commit();

          // Update screen state
          setScenarios(prev => prev.map(id => (id === oldId ? newId : id)));
          alert("Scenario name has been changed.");
        }
      } catch (error) {
        console.error("Error renaming scenario: ", error);
        alert("Failed to rename.");
      }
    }
  };

  // --- 💡 Added part: Scenario delete function ---
  const handleDeleteScenario = async (idToDelete) => {
    if (window.confirm(`Are you sure you want to delete the '${idToDelete}' scenario?`)) {
      const docRef = doc(db, "scenarios", idToDelete);
      try {
        await deleteDoc(docRef);
        setScenarios(prev => prev.filter(id => id !== idToDelete));
        alert("Scenario has been deleted.");
      } catch (error) {
        console.error("Error deleting scenario: ", error);
        alert("Failed to delete.");
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Chatbot Scenario List</h1>
      <ul style={styles.list}>
        {scenarios.map(id => (
          <li key={id} style={styles.listItem}>
            <span
                onClick={() => onSelect(id)}
                style={styles.scenarioName}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {id}
            </span>
            {/* --- 💡 Added part: Edit and delete buttons --- */}
            <div style={styles.buttonGroup}>
              <button onClick={() => handleRenameScenario(id)} style={styles.actionButton}>Edit</button>
              <button onClick={() => handleDeleteScenario(id)} style={{...styles.actionButton, color: 'red'}}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={handleAddScenario} style={styles.button}>
        + Add New Scenario
      </button>
    </div>
  );
}

export default ScenarioList;