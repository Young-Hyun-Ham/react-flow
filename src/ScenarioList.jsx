import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// 간단한 스타일 객체
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
    const newScenarioName = prompt("새 시나리오의 이름을 입력하세요:");
    if (newScenarioName) {
      const newScenarioRef = doc(db, "scenarios", newScenarioName);
      try {
        await setDoc(newScenarioRef, { nodes: [], edges: [] });
        setScenarios(prev => [...prev, newScenarioName]);
        alert(`'${newScenarioName}' 시나리오가 생성되었습니다.`);
      } catch (error) {
        console.error("Error creating new scenario: ", error);
        alert("시나리오 생성에 실패했습니다.");
      }
    }
  };

  // --- 💡 추가된 부분: 시나리오 이름 변경 함수 ---
  const handleRenameScenario = async (oldId) => {
    const newId = prompt("새로운 시나리오 이름을 입력하세요:", oldId);
    if (newId && newId !== oldId) {
      const oldDocRef = doc(db, "scenarios", oldId);
      const newDocRef = doc(db, "scenarios", newId);

      try {
        const oldDocSnap = await getDoc(oldDocRef);
        if (oldDocSnap.exists()) {
          // batch write를 사용하여 여러 작업을 원자적으로 처리
          const batch = writeBatch(db);
          batch.set(newDocRef, oldDocSnap.data()); // 새 문서 생성
          batch.delete(oldDocRef); // 기존 문서 삭제
          await batch.commit();

          // 화면 상태 업데이트
          setScenarios(prev => prev.map(id => (id === oldId ? newId : id)));
          alert("시나리오 이름이 변경되었습니다.");
        }
      } catch (error) {
        console.error("Error renaming scenario: ", error);
        alert("이름 변경에 실패했습니다.");
      }
    }
  };

  // --- 💡 추가된 부분: 시나리오 삭제 함수 ---
  const handleDeleteScenario = async (idToDelete) => {
    if (window.confirm(`'${idToDelete}' 시나리오를 정말 삭제하시겠습니까?`)) {
      const docRef = doc(db, "scenarios", idToDelete);
      try {
        await deleteDoc(docRef);
        setScenarios(prev => prev.filter(id => id !== idToDelete));
        alert("시나리오가 삭제되었습니다.");
      } catch (error) {
        console.error("Error deleting scenario: ", error);
        alert("삭제에 실패했습니다.");
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
          <li key={id} style={styles.listItem}>
            <span
                onClick={() => onSelect(id)}
                style={styles.scenarioName}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {id}
            </span>
            {/* --- 💡 추가된 부분: 수정 및 삭제 버튼 --- */}
            <div style={styles.buttonGroup}>
              <button onClick={() => handleRenameScenario(id)} style={styles.actionButton}>수정</button>
              <button onClick={() => handleDeleteScenario(id)} style={{...styles.actionButton, color: 'red'}}>삭제</button>
            </div>
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