import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function ConfirmationNode({ id, data }) {
  // --- 💡 수정된 부분 ---
  const updateNodeData = useStore((state) => state.updateNodeData);
  const deleteNode = useStore((state) => state.deleteNode);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerConfirmation}`}>
        <span className={styles.headerTextContent}>Type: confirmation</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{data.id || 'ID'}</span>
          <textarea
            className={styles.textInput}
            defaultValue={data.content}
            onChange={(evt) => updateNodeData(id, { content: evt.target.value })}
            rows={4}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Replies:</span>
          {data.replies?.map((reply, index) => (
            <div key={index} className={styles.quickReply}>
              <span>{reply.display}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={reply.value}
                style={{ top: `${170 + index * 40}px`, background: '#555' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ConfirmationNode;