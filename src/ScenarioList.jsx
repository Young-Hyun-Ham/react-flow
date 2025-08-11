import { useState, useEffect } from 'react';
// --- 💡 수정된 부분: Firebase 관련 모듈 import 정리 ---
import { collection, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

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

// --- 💡 수정된 부분: App.jsx로부터 props를 전달받도록 변경 ---
function ScenarioList({ onSelect, onAddScenario, scenarios, setScenarios }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchScenarios();
  }, [setScenarios]);


  // --- 💡 수정된 부분: 시나리오 추가 함수 삭제 (App.jsx로 이동) ---

  const handleRenameScenario = async (oldId) => {
    const newId = prompt("Enter the new scenario name:", oldId);
    if (newId && newId !== oldId) {
      if (scenarios.includes(newId)) {
        alert("A scenario with that name already exists. Please choose a different name.");
        return;
      }
      const oldDocRef = doc(db, "scenarios", oldId);
      const newDocRef = doc(db, "scenarios", newId);

      try {
        const oldDocSnap = await getDoc(oldDocRef);
        if (oldDocSnap.exists()) {
          const batch = writeBatch(db);
          batch.set(newDocRef, oldDocSnap.data());
          batch.delete(oldDocRef);
          await batch.commit();

          setScenarios(prev => prev.map(id => (id === oldId ? newId : id)));
          alert("Scenario name has been changed.");
        }
      } catch (error) {
        console.error("Error renaming scenario: ", error);
        alert("Failed to rename.");
      }
    }
  };

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
            <div style={styles.buttonGroup}>
              <button onClick={() => handleRenameScenario(id)} style={styles.actionButton}>Edit</button>
              <button onClick={() => handleDeleteScenario(id)} style={{...styles.actionButton, color: 'red'}}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {/* --- 💡 수정된 부분: onClick 이벤트에 onAddScenario prop 사용 --- */}
      <button onClick={onAddScenario} style={styles.button}>
        + Add New Scenario
      </button>
    </div>
  );
}

export default ScenarioList;