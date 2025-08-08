import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { useEffect, useRef } from 'react';

function FixedMenuNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const branchOptionRefs = useRef([]);

  useEffect(() => {
    branchOptionRefs.current = branchOptionRefs.current.slice(0, data.replies?.length);
  }, [data.replies]);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerFixedMenu}`}>
        <span className={styles.headerTextContent}>Fixed Menu</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>❌</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Menu Title</span>
          <textarea
            className={styles.textInput}
            value={data.content || ''}
            readOnly
            rows={2}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Menus:</span>
          <div className={styles.branchOptionsContainer}>
            {data.replies?.map((reply, index) => (
              <div key={reply.value} className={styles.branchOption} ref={el => branchOptionRefs.current[index] = el}>
                <span className={styles.branchOptionButton}>{reply.display}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={reply.value}
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

export default FixedMenuNode;