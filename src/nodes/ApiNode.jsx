import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function ApiNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerApi}`}>
        <span className={styles.headerTextContent}>API</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>❌</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Question</span>
          {/* --- 💡 Modified part: readOnly added --- */}
          <textarea
            className={styles.textInput}
            value={data.content}
            readOnly
            rows={2}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Slot:</span>
          {/* --- 💡 Modified part: readOnly added --- */}
          <input
            className={styles.textInput}
            value={data.slot}
            readOnly
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Replies:</span>
          {data.replies?.map((reply) => (
            <div key={reply.value} className={styles.quickReply}>
               {/* Quick Replies can only be modified in controller, so changed to readOnly */}
              <input
                className={styles.quickReplyInput}
                value={reply.display}
                readOnly
                placeholder="Display text"
              />
              <input
                className={styles.quickReplyInput}
                value={reply.value}
                readOnly
                placeholder="Actual value"
              />
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export default ApiNode;