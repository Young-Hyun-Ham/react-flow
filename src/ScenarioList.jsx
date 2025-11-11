// src/ScenarioList.jsx

import { useState, useEffect, useMemo } from 'react';
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
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between', 
    alignItems: 'center', 
    maxWidth: '600px',
    margin: '0 auto 10px auto', 
  },
  sortSelect: {
    padding: '5px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    backgroundColor: '#fff',
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
    marginRight: '15px',
    minWidth: 0, 
    overflow: 'hidden',
  },
  scenarioHeader: {
    display: 'flex',
    alignItems: 'baseline', 
    gap: '8px', 
    flexWrap: 'nowrap', 
    marginBottom: '0', 
    width: '100%', 
    overflow: 'hidden', 
  },
  scenarioName: {
    fontWeight: 'bold',
    flexGrow: 1, 
    whiteSpace: 'nowrap', 
    overflow: 'hidden',
    textOverflow: 'ellipsis', 
    minWidth: 0, 
  },
  scenarioTimestamp: {
    fontSize: '0.8rem',
    color: '#606770',
    marginLeft: 'auto', 
    flexShrink: 0, 
    whiteSpace: 'nowrap', 
    paddingLeft: '10px', 
  },
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
    padding: '3px 10px',
    fontSize: '1rem',
  }
};

// --- 👇 [추가] 상대 시간 계산 헬퍼 함수 ---
/**
 * Date 객체를 받아 현재 시간과의 차이를 상대 시간 문자열(10s, 5m, 1h, 1d 등)로 변환
 * @param {Date} date - 비교할 과거 날짜 객체
 * @returns {string} - 변환된 상대 시간 문자열
 */
const formatTimeAgo = (date) => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s`; // 초
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`; // 분
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`; // 시간
  }

  const days = Math.floor(hours / 24);
  return `${days}d`; // 일
};
// --- 👆 [추가 끝] ---

function ScenarioList({ backend, onSelect, onAddScenario, onEditScenario, scenarios, setScenarios }) {
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt' 또는 'lastUsedAt'
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
          updatedAt: scenario.updatedAt || null,
          lastUsedAt: scenario.lastUsedAt || null 
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

  const sortedScenarios = useMemo(() => {
    const parseDate = (timestamp) => {
      if (!timestamp) return new Date(0); // null이나 undefined는 가장 오래된 날짜로 취급
      return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    };

    return [...scenarios].sort((a, b) => {
      const dateA = parseDate(a[sortBy]);
      const dateB = parseDate(b[sortBy]);
      
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return dateB - dateA; // 내림차순 (최신순)
    });
  }, [scenarios, sortBy]);


  const handleCloneScenario = async (scenarioToClone) => {
    const newName = prompt(`Enter the new name for the cloned scenario:`, `${scenarioToClone.name}_copy`);
    if (newName && newName.trim()) {
      if (scenarios.some(s => s.name === newName.trim())) {
        showAlert("A scenario with that name already exists.");
        return;
      }
      try {
        const newScenario = await backendService.cloneScenario(backend, {
          scenarioToClone: { ...scenarioToClone, description: scenarioToClone.description || '' }, // description도 전달
          newName: newName.trim(),
        });
        setScenarios(prev => [
          ...prev, 
          { ...newScenario, description: newScenario.description || '', lastUsedAt: null }
        ]);
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
      <div style={styles.listHeader}>
        <button onClick={onAddScenario} style={styles.button}>
          + Add New Scenario
        </button>
        <select 
          style={styles.sortSelect} 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="updatedAt">최근 수정 순</option>
          <option value="lastUsedAt">최근 호출 순</option>
        </select>
      </div>

      <ul style={styles.list}>
        {sortedScenarios.map(scenario => {
          const lastUsedAtDate = scenario.lastUsedAt
            ? (scenario.lastUsedAt.toDate ? scenario.lastUsedAt.toDate() : new Date(scenario.lastUsedAt))
            : null;

          return (
            <li key={scenario.id} style={styles.listItem}>
              <div
                  style={styles.scenarioInfo}
                  onClick={() => onSelect(scenario)}
                  onMouseOver={(e) => {
                      const nameElement = e.currentTarget.querySelector('span[style*="fontWeight: bold"]'); 
                      if(nameElement) nameElement.style.textDecoration = 'underline';
                   }}
                  onMouseOut={(e) => {
                      const nameElement = e.currentTarget.querySelector('span[style*="fontWeight: bold"]');
                      if(nameElement) nameElement.style.textDecoration = 'none';
                   }}
              >
                <div style={styles.scenarioHeader}>
                  <span style={styles.scenarioName} title={scenario.name}>{scenario.name}</span>
                  
                  {/* --- 👇 [수정] formatTimeAgo 함수 사용 --- */}
                  {lastUsedAtDate && !isNaN(lastUsedAtDate) && (
                    <span style={styles.scenarioTimestamp}>
                      (Used: {formatTimeAgo(lastUsedAtDate)})
                    </span>
                  )}
                  {/* --- 👆 [수정 끝] --- */}
                </div>
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
          );
        })}
      </ul>
    </div>
  );
}

export default ScenarioList;