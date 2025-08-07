import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { useEffect, useRef } from 'react';

function BranchNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const branchOptionRefs = useRef([]);

  useEffect(() => {
    branchOptionRefs.current = branchOptionRefs.current.slice(0, data.replies?.length);
  }, [data.replies]);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerBranch}`}>
        <span className={styles.headerTextContent}>조건분기</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>❌</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Branch Text</span>
          <textarea
            className={styles.textInput}
            value={data.content || ''}
            onChange={(e) => updateNodeData(id, { content: e.target.value })}
            rows={4}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Branches:</span>
          <div className={styles.branchOptionsContainer}>
            {data.replies?.map((reply, index) => (
              <div key={reply.value} className={styles.branchOption} ref={el => branchOptionRefs.current.push(el)}>
                <span className={styles.branchOptionButton}>{reply.display}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={reply.value}
                  // --- 💡 수정: Handle의 세로 위치를 부모 요소의 높이의 중앙으로 조정 ---
                  style={{ top: '50%', transform: 'translateY(-50%)', right: '-25px', background: '#555' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchNode;