import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// 간단한 스타일 객체
const styles = {
  container: {
    padding: '40px',
    color: '#333',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '20px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    maxWidth: '500px',
    margin: '0 auto',
  },
  listItem: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
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
  }, []);

  const handleAddScenario = async () => {
    const newScenarioName = prompt("새 시나리오의 이름을 입력하세요:");
    if (newScenarioName) {
      const newScenarioRef = doc(db, "scenarios", newScenarioName);
      try {
        // 빈 노드와 엣지로 새로운 시나리오 문서 생성
        await setDoc(newScenarioRef, { nodes: [], edges: [] });
        setScenarios(prev => [...prev, newScenarioName]);
        alert(`'${newScenarioName}' 시나리오가 생성되었습니다.`);
      } catch (error) {
        console.error("Error creating new scenario: ", error);
        alert("시나리오 생성에 실패했습니다.");
      }
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>챗봇 시나리오 목록</h1>
      <ul style={styles.list}>
        {scenarios.map(id => (
          <li
            key={id}
            onClick={() => onSelect(id)}
            style={styles.listItem}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {id}
          </li>
        ))}
      </ul>
      <button onClick={handleAddScenario} style={styles.button}>
        + 새 시나리오 추가
      </button>
    </div>
  );
}

export default ScenarioList;