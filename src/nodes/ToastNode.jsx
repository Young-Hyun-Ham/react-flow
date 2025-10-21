import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
// <<< [수정] StartNodeIcon 추가 >>>
import { AnchorIcon, ToastIcon, StartNodeIcon } from '../components/Icons';

function ToastNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const anchorNodeId = useStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useStore((state) => state.setAnchorNodeId);
  const startNodeId = useStore((state) => state.startNodeId); // <<< [추가]
  const setStartNodeId = useStore((state) => state.setStartNodeId); // <<< [추가]
  const nodeColor = useStore((state) => state.nodeColors.toast);
  const textColor = useStore((state) => state.nodeTextColors.toast);

  const isAnchored = anchorNodeId === id;
  const isStartNode = startNodeId === id; // <<< [추가]

  return (
    // <<< [수정] isStartNode 클래스 추가 >>>
    <div className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''} ${isStartNode ? styles.startNode : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <div className={styles.headerLeft}>
            <ToastIcon />
            <span className={styles.headerTextContent}>Toast</span>
        </div>
        <div className={styles.headerButtons}>
            {/* <<< [추가] 시작 노드 설정 버튼 >>> */}
            <button
              onClick={(e) => { e.stopPropagation(); setStartNodeId(id); }}
              className={`${styles.startNodeButton} ${isStartNode ? styles.active : ''}`}
              title="Set as Start Node"
            >
              <StartNodeIcon />
            </button>
            {/* <<< [추가 끝] >>> */}
            <button
              onClick={(e) => { e.stopPropagation(); setAnchorNodeId(id); }}
              className={`${styles.anchorButton} ${isAnchored ? styles.active : ''}`}
              title="Set as anchor"
            >
              <AnchorIcon />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
              className={styles.deleteButton}
              style={{ color: textColor }}
            >
              X
            </button>
        </div>
      </div>

      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Message</span>
          <textarea
            className={styles.textInput}
            value={data.message || ''}
            readOnly
            rows={3}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Type</span>
           <input
            type="text"
            className={styles.textInput}
            value={data.toastType || 'info'}
            readOnly // Controller에서 수정
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default ToastNode;