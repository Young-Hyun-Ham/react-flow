import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { useEffect, useRef } from 'react';
import { AnchorIcon } from '../components/Icons';

function FixedMenuNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const anchorNodeId = useStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useStore((state) => state.setAnchorNodeId);
  const branchOptionRefs = useRef([]);
  const nodeColor = useStore((state) => state.nodeColors.fixedmenu);
  const textColor = useStore((state) => state.nodeTextColors.fixedmenu);
  
  const isAnchored = anchorNodeId === id;

  useEffect(() => {
    branchOptionRefs.current = branchOptionRefs.current.slice(0, data.replies?.length);
  }, [data.replies]);

  return (
    <div className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>Fixed Menu</span>
        <div className={styles.headerButtons}>
            <button
              onClick={(e) => { e.stopPropagation(); setAnchorNodeId(id); }}
              className={`${styles.anchorButton} ${isAnchored ? styles.active : ''}`}
              title="Set as anchor"
            >
              <AnchorIcon />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
        </div>
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