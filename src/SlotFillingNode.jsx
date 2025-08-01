import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from './store'; // Zustand 스토어를 import 합니다.

function SlotFillingNode({ id, data }) {
  const updateNodeContent = useStore((state) => state.updateNodeContent);
  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerSlotFilling}`}>
        <span className={styles.headerTextContent}>Type: slotFilling</span>
        <button className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{data.id || 'ID'}</span>
          <textarea
            className={styles.textInput}
            defaultValue={data.content}
            onChange={(evt) => updateNodeContent(id, evt.target.value)}
            rows={2}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Slot:</span>
          <input className={styles.textInput} defaultValue={data.slot} />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Replies:</span>
          {data.replies?.map((reply, index) => (
            <div key={index} className={styles.quickReply}>
              <input className={styles.quickReplyInput} defaultValue={reply.display} />
              <input className={styles.quickReplyInput} defaultValue={reply.value} />
              <span>×</span>
            </div>
          ))}
          <button className={styles.addReplyButton}>Add Reply</button>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export default SlotFillingNode;