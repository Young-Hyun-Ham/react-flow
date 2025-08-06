import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function MessageNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const addReply = useStore((state) => state.addReply);
  const updateReply = useStore((state) => state.updateReply);
  const deleteReply = useStore((state) => state.deleteReply);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerMessage}`}>
        <span className={styles.headerTextContent}>Message</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Content</span>
          {/* --- 💡 수정된 부분: readOnly 추가, onChange 제거 --- */}
          <textarea
            className={styles.textInput}
            value={data.content}
            readOnly
            rows={3}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Replies:</span>
          {data.replies?.map((reply, index) => (
            <div key={reply.value} className={styles.quickReply}>
              {/* Quick Replies는 컨트롤러에서만 수정하므로 readOnly로 변경 */}
              <input
                className={styles.quickReplyInput}
                value={reply.display}
                readOnly
                placeholder="표시될 텍스트"
              />
              <input
                className={styles.quickReplyInput}
                value={reply.value}
                readOnly
                placeholder="실제 값"
              />
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export default MessageNode;