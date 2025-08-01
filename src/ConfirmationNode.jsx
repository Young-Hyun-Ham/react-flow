import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from './store'; // Zustand 스토어를 import 합니다.

function ConfirmationNode({ id, data }) {
  const updateNodeContent = useStore((state) => state.updateNodeContent);
  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerConfirmation}`}>
        <span className={styles.headerTextContent}>Type: confirmation</span>
        <button className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{data.id || 'ID'}</span>
          <textarea
            className={styles.textInput}
            defaultValue={data.content}
            onChange={(evt) => updateNodeContent(id, evt.target.value)}
            rows={4}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Replies:</span>
          {data.replies?.map((reply, index) => (
            <div key={index} className={styles.quickReply}>
              <span>{reply.display}</span>
              {/* 각 Reply에 대한 개별 핸들(연결점) */}
              <Handle
                type="source"
                position={Position.Right}
                id={reply.value} // 핸들의 고유 ID
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