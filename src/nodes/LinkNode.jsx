import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function LinkNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerLink}`}>
        <span className={styles.headerTextContent}>링크</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>❌</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Display Text</span>
          <input
            className={styles.textInput}
            value={data.display}
            readOnly
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>URL</span>
          <textarea
            className={styles.textInput}
            value={data.content}
            readOnly
            rows={2}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default LinkNode;