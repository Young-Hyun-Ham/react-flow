import { useState, useEffect } from 'react';

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

function ScenarioList({ onSelect, onAddScenario, scenarios, setScenarios }) {
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = '/api/proxy/chat/scenarios/1000/DEV';

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const scenarioList = data.scenarios || data; 
        setScenarios(scenarioList);
      } catch (error) {
        console.error("Error fetching scenarios:", error);
        alert("시나리오 목록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [setScenarios]);

  const handleRenameScenario = async (oldScenario) => {
    const newName = prompt("Enter the new scenario name:", oldScenario.name);
    if (newName && newName.trim() && newName !== oldScenario.name) {
      if (scenarios.some(s => s.name === newName)) {
        alert("A scenario with that name already exists.");
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/${oldScenario.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to rename scenario');
        }
        
        setScenarios(prev => prev.map(s => (s.id === oldScenario.id ? { ...s, name: newName } : s)));
        alert("Scenario renamed successfully.");
      } catch (error) {
        console.error("Error renaming scenario:", error);
        alert(`Failed to rename scenario: ${error.message}`);
      }
    }
  };

  // --- 💡 수정된 부분: 시나리오 삭제 API 연동 로직 ---
  const handleDeleteScenario = async (scenarioId) => {
    if (showConfirm(`Are you sure you want to delete this scenario?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/${scenarioId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
            // DELETE 요청은 본문이 없을 수 있으므로, 에러 처리 분기
            let errorDetail = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetail = errorData.detail ? JSON.stringify(errorData.detail) : errorDetail;
            } catch (e) {
                // JSON 파싱 실패 시, 상태 코드로 오류 메시지 설정
            }
            throw new Error(errorDetail);
        }
        
        setScenarios(prev => prev.filter(s => s.id !== scenarioId));
        alert("Scenario deleted successfully.");
      } catch (error) {
        console.error("Error deleting scenario:", error);
        alert(`Failed to delete scenario: ${error.message}`);
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
                onClick={() => onSelect(scenario.id)}
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