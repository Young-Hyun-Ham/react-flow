import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function SlotFillingNode({ id, data }) {
  // --- 💡 수정된 부분: useStore를 각 액션마다 개별적으로 호출 ---
  const updateNodeData = useStore((state) => state.updateNodeData);
  const deleteNode = useStore((state) => state.deleteNode);
  const addReply = useStore((state) => state.addReply);
  const updateReply = useStore((state) => state.updateReply);
  const deleteReply = useStore((state) => state.deleteReply);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerSlotFilling}`}>
        <span className={styles.headerTextContent}>Type: slotFilling</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{data.id || 'ID'}</span>
          <textarea
            className={styles.textInput}
            defaultValue={data.content}
            onChange={(evt) => updateNodeData(id, { content: evt.target.value })}
            rows={2}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Slot:</span>
          <input
            className={styles.textInput}
            defaultValue={data.slot}
            onChange={(evt) => updateNodeData(id, { slot: evt.target.value })}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Replies:</span>
          {data.replies?.map((reply, index) => (
            <div key={index} className={styles.quickReply}>
              <input
                className={styles.quickReplyInput}
                defaultValue={reply.display}
                onChange={(e) => updateReply(id, index, 'display', e.target.value)}
                placeholder="표시될 텍스트"
              />
              <input
                className={styles.quickReplyInput}
                defaultValue={reply.value}
                onChange={(e) => updateReply(id, index, 'value', e.target.value)}
                placeholder="실제 값"
              />
              <button onClick={() => deleteReply(id, index)} className={styles.deleteReplyButton}>×</button>
            </div>
          ))}
          <button onClick={() => addReply(id)} className={styles.addReplyButton}>Add Reply</button>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export default SlotFillingNode;