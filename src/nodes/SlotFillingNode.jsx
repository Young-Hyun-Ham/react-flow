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

function SlotFillingNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const nodeColor = useStore((state) => state.nodeColors.slotfilling);
  const textColor = useStore((state) => state.nodeTextColors.slotfilling);
  // const textColor = getTextColorByBackgroundColor(nodeColor);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>SlotFilling</span>
        {/* --- 💡 수정된 부분: onClick 핸들러에 e.stopPropagation() 추가 --- */}
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Question</span>
          <textarea
            className={styles.textInput}
            value={data.content}
            readOnly
            rows={2}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Slot:</span>
          <input
            className={styles.textInput}
            value={data.slot}
            readOnly
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Replies:</span>
          {data.replies?.map((reply) => (
            <div key={reply.value} className={styles.quickReply}>
               <input
                className={styles.quickReplyInput}
                value={reply.display}
                readOnly
                placeholder="Display text"
              />
              <input
                className={styles.quickReplyInput}
                value={reply.value}
                readOnly
                placeholder="Actual value"
              />
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export default SlotFillingNode;