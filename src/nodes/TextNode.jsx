import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function TextNode({ id, data }) {
  // --- 💡 수정된 부분 ---
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerText}`}>
        <span className={styles.headerTextContent}>Type: text</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{data.id || 'ID'}</span>
          <textarea
            className={styles.textInput}
            defaultValue={data.content}
            onChange={(evt) => updateNodeData(id, { content: evt.target.value })}
            rows={3}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Replies:</span>
          <button className={styles.addReplyButton}>Add Reply</button>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export default TextNode;