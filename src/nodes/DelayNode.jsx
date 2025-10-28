// src/nodes/DelayNode.jsx

import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { AnchorIcon, DelayNodeIcon, StartNodeIcon } from '../components/Icons'; // DelayNodeIcon 추가

function DelayNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const anchorNodeId = useStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useStore((state) => state.setAnchorNodeId);
  const startNodeId = useStore((state) => state.startNodeId);
  const setStartNodeId = useStore((state) => state.setStartNodeId);
  const nodeColor = useStore((state) => state.nodeColors.delay) || '#f1c40f'; // 기본 색상 추가
  const textColor = useStore((state) => state.nodeTextColors.delay) || '#333333'; // 기본 텍스트 색상 추가

  const isAnchored = anchorNodeId === id;
  const isStartNode = startNodeId === id;

  return (
    <div className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''} ${isStartNode ? styles.startNode : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <div className={styles.headerLeft}>
            <DelayNodeIcon /> {/* 아이콘 사용 */}
            <span className={styles.headerTextContent}>Delay</span>
        </div>
        <div className={styles.headerButtons}>
            <button
              onClick={(e) => { e.stopPropagation(); setStartNodeId(id); }}
              className={`${styles.startNodeButton} ${isStartNode ? styles.active : ''}`}
              title="Set as Start Node"
            >
              <StartNodeIcon />
            </button>
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
          <span className={styles.sectionTitle}>Duration</span>
          <div className={styles.previewBox} style={{ textAlign: 'center' }}>
            {/* 밀리초(ms) 단위로 표시 */}
            {data.duration || 0} ms
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default DelayNode;