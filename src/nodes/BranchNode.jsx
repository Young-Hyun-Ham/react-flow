import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function BranchNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);

  // 기본 핸들 높이와 각 항목의 높이를 기반으로 동적으로 핸들 위치 계산
  const baseTop = 155; // 헤더와 content 영역의 대략적인 높이
  const itemHeight = 45; // 각 reply 항목의 높이

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerBranch}`}>
        <span className={styles.headerTextContent}>조건분기</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
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
          <span className={styles.sectionTitle}>Branches:</span>
          {/* --- 💡 수정된 부분: key={index} -> key={reply.value} --- */}
          {data.replies?.map((reply, index) => (
            <div key={reply.value} className={styles.quickReply}>
              <span>{reply.display}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={reply.value}
                style={{ top: `${baseTop + index * itemHeight}px`, background: '#555' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BranchNode;