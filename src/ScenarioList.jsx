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
  title: {
    fontSize: '2rem',
    marginBottom: '20px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    maxWidth: '600px', // 목록 최대 너비 유지
    margin: '0 auto',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center', // 세로 중앙 정렬 유지
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
    marginRight: '15px',
    // <<< [수정] flex-direction: column 제거 ---
    // 세로 정렬 대신 가로 정렬 기본값 사용
    // --- [수정 끝] >>>
  },
  // <<< [수정] scenarioHeader 스타일 변경 ---
  scenarioHeader: {
    display: 'flex',
    alignItems: 'baseline', // 이름과 설명을 기준선에 맞춤
    gap: '8px', // 이름과 설명 사이 간격
    flexWrap: 'wrap', // 내용이 길면 줄바꿈 허용
    marginBottom: '0', // 하단 마진 제거
  },
  // --- [수정 끝] >>>
  scenarioName: {
    fontWeight: 'bold',
    marginRight: 'auto', // 이름은 왼쪽에 붙도록
  },
  // <<< [수정] 설명 스타일 변경 ---
  scenarioDescription: {
      fontSize: '0.85rem',
      color: '#606770',
      // marginTop 제거
      // 여러 줄 표시 제거 (한 줄로 표시하고 말줄임표)
      whiteSpace: 'nowrap', // 한 줄로 표시
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flexShrink: 1, // 공간 부족 시 줄어들도록
      // WebkitLineClamp 제거
      // WebkitBoxOrient 제거
      // display 제거
  },
  // --- [수정 끝] >>>
  // <<< [제거] jobBadge 스타일 제거 ---
  // jobBadge: { ... },
  // --- [제거 끝] >>>
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexShrink: 0,
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

// <<< [제거] getJobBadgeStyle 함수 제거 ---
// const getJobBadgeStyle = (job) => { ... };
// --- [제거 끝] >>>

function ScenarioList({ backend, onSelect, onAddScenario, onEditScenario, scenarios, setScenarios }) {
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    const fetchAndSetScenarios = async () => {
      setLoading(true);
      try {
        let scenarioList = await backendService.fetchScenarios(backend);
        scenarioList = scenarioList.map(scenario => ({
          ...scenario,
          job: scenario.job || 'Process',
          description: scenario.description || '',
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
        setScenarios(prev => [...prev, { ...newScenario, description: newScenario.description || '' }]);
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
                onMouseOver={(e) => {
                    const nameElement = e.currentTarget.querySelector('span[style*="fontWeight: bold"]'); // scenarioName 스타일 직접 참조 대신 구조 기반 선택
                    if(nameElement) nameElement.style.textDecoration = 'underline';
                 }}
                onMouseOut={(e) => {
                    const nameElement = e.currentTarget.querySelector('span[style*="fontWeight: bold"]');
                    if(nameElement) nameElement.style.textDecoration = 'none';
                 }}
            >
              {/* --- 👇 [수정] Job 뱃지 제거, 이름과 설명을 한 줄에 표시 --- */}
              <div style={styles.scenarioHeader}>
                <span style={styles.scenarioName}>{scenario.name}</span>
                {/* Job Badge Span 제거됨 */}
                {scenario.description && (
                  <span style={styles.scenarioDescription}> - {scenario.description}</span> // 설명 앞에 '-' 추가
                )}
              </div>
              {/* description <p> 태그 제거됨 */}
              {/* --- 👆 [수정 끝] --- */}
            </div>
            <div style={styles.buttonGroup}>
                <button
                    onClick={(e) => { e.stopPropagation(); onEditScenario(scenario); }}
                    style={styles.actionButton}
                    title="Edit"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#343a40'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#606770'; }}
                >
                    <EditIcon />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleCloneScenario(scenario); }}
                    style={{...styles.actionButton}}
                    title="Clone"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#3498db'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#606770'; }}
                >
                    <CloneIcon />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteScenario(scenario.id); }}
                    style={styles.actionButton}
                    title="Delete"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#e74c3c'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#606770'; }}
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