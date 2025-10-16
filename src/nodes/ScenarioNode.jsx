import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { CollapseNodeIcon, ExpandNodeIcon } from '../components/Icons'; 

function ScenarioNode({ id, data }) {
  const nodeColor = useStore((state) => state.nodeColors.scenario) || '#7f8c8d';
  const textColor = useStore((state) => state.nodeTextColors.scenario) || '#ffffff';
  const toggleScenarioNode = useStore((state) => state.toggleScenarioNode);
  const deleteNode = useStore((state) => state.deleteNode);

  const isCollapsed = data.isCollapsed || false;

  return (
    <div 
      className={`${styles.nodeWrapper} ${styles.scenarioNodeWrapper}`}
      style={isCollapsed ? { height: '50px', width: '250px' } : {}}
    >
      {/* --- 💡 수정된 부분 시작 --- */}
      <Handle type="target" position={Position.Left} />
      {/* --- 💡 수정된 부분 끝 --- */}
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>Scenario: {data.label}</span>
        <div className={styles.headerButtons}>
            <button onClick={() => toggleScenarioNode(id)} className={styles.anchorButton}>
              {isCollapsed ? <ExpandNodeIcon /> : <CollapseNodeIcon />}
            </button>
            <button onClick={() => deleteNode(id)} className={styles.deleteButton} style={{color: textColor, fontSize: '1rem', marginRight: '-5px'}}>
                &times;
            </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className={styles.nodeBody}>
          <p className={styles.scenarioDescription}>
            This is a group containing the '{data.label}' scenario.
          </p>
        </div>
      )}
      {/* --- 💡 수정된 부분 시작 --- */}
      <Handle type="source" position={Position.Right} />
      {/* --- 💡 수정된 부분 끝 --- */}
    </div>
  );
}

export default ScenarioNode;