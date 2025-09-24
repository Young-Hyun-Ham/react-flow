import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { AnchorIcon } from '../components/Icons';

function MessageNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const anchorNodeId = useStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useStore((state) => state.setAnchorNodeId);
  const nodeColor = useStore((state) => state.nodeColors.message);
  const textColor = useStore((state) => state.nodeTextColors.message);

  const isAnchored = anchorNodeId === id;

  return (
    <div className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>Message</span>
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
          <span className={styles.sectionTitle}>Content</span>
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
export default MessageNode;