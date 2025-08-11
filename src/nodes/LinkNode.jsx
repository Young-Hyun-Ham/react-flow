import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

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

function LinkNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const nodeColor = useStore((state) => state.nodeColors.link);
  const textColor = getTextColorByBackgroundColor(nodeColor);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>Link</span>
        {/* --- 💡 수정된 부분: onClick 핸들러에 e.stopPropagation() 추가 --- */}
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton}>❌</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Display Text</span>
          <input
            className={styles.textInput}
            value={data.display}
            readOnly
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>URL</span>
          <textarea
            className={styles.textInput}
            value={data.content}
            readOnly
            rows={2}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default LinkNode;