import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
// <<< [수정] StartNodeIcon 추가 >>>
import { AnchorIcon, SetSlotIcon, StartNodeIcon } from '../components/Icons';

function SetSlotNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const anchorNodeId = useStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useStore((state) => state.setAnchorNodeId);
  const startNodeId = useStore((state) => state.startNodeId); // <<< [추가]
  const setStartNodeId = useStore((state) => state.setStartNodeId); // <<< [추가]
  const nodeColor = useStore((state) => state.nodeColors.setSlot) || '#8e44ad';
  const textColor = useStore((state) => state.nodeTextColors.setSlot) || '#ffffff';

  const isAnchored = anchorNodeId === id;
  const isStartNode = startNodeId === id; // <<< [추가]

  return (
    // <<< [수정] isStartNode 클래스 추가 >>>
    <div className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''} ${isStartNode ? styles.startNode : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <div className={styles.headerLeft}>
            <SetSlotIcon />
            <span className={styles.headerTextContent}>Set Slot</span>
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
          <span className={styles.sectionTitle}>Assignments</span>
          {(data.assignments || []).map((assign, index) => (
            <div key={index} className={styles.previewBox}>
              <span style={{fontWeight: 'bold'}}>{assign.key}</span> = <span>{assign.value}</span>
            </div>
          ))}
          {(!data.assignments || data.assignments.length === 0) && (
            <div className={styles.formElementsPlaceholder}>No assignments configured.</div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default SetSlotNode;