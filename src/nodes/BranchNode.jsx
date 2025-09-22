import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function BranchNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const nodeColor = useStore((state) => state.nodeColors.branch);
  const textColor = useStore((state) => state.nodeTextColors.branch);

  const isConditionType = data.evaluationType === 'CONDITION';

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>Condition Branch</span>
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Branch Text</span>
          <textarea
            className={styles.textInput}
            value={data.content || ''}
            readOnly
            rows={4}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>
            Branches ({isConditionType ? 'Conditions' : 'Buttons'})
          </span>
          <div className={styles.branchOptionsContainer}>
            {isConditionType ? (
              data.conditions?.map((cond, index) => (
                <div key={cond.id || index} className={styles.branchOption}>
                  <span className={styles.branchOptionButton}>
                    {`{${cond.slot}} ${cond.operator} ${cond.value}`}
                  </span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={data.replies?.[index]?.value} // Use corresponding reply value for handle id
                    style={{ top: '50%', transform: 'translateY(-50%)', right: '-25px', background: '#555' }}
                  />
                </div>
              ))
            ) : (
              data.replies?.map((reply, index) => (
                <div key={reply.value} className={styles.branchOption}>
                  <span className={styles.branchOptionButton}>{reply.display}</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={reply.value}
                    style={{ top: '50%', transform: 'translateY(-50%)', right: '-25px', background: '#555' }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchNode;