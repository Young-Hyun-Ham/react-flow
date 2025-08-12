import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { useEffect, useRef } from 'react';

const getTextColorByBackgroundColor = (hexColor) => {
    if (!hexColor) return 'white';
    const c = hexColor.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? 'white' : 'black';
}

function BranchNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const branchOptionRefs = useRef([]);
  const nodeColor = useStore((state) => state.nodeColors.branch);
  const textColor = getTextColorByBackgroundColor(nodeColor);

  useEffect(() => {
    branchOptionRefs.current = branchOptionRefs.current.slice(0, data.replies?.length);
  }, [data.replies]);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>Condition Branch</span>
        {/* --- 💡 수정된 부분: onClick 핸들러에 e.stopPropagation() 추가 --- */}
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Branch Text</span>
          <textarea
            className={styles.textInput}
            value={data.content || ''}
            onChange={(e) => updateNodeData(id, { content: e.target.value })}
            readOnly
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