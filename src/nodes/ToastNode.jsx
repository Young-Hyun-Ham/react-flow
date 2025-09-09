import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

// Toast 아이콘 SVG 컴포넌트
const ToastIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z" />
        <path d="M4 9h16" />
        <path d="M8 13h1" />
        <path d="M12 13h1" />
    </svg>
);


function ToastNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const nodeColor = useStore((state) => state.nodeColors.toast);
  const textColor = useStore((state) => state.nodeTextColors.toast);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <div className={styles.headerLeft}>
            <ToastIcon />
            <span className={styles.headerTextContent}>Toast</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); deleteNode(id); }} 
          className={styles.deleteButton} 
          style={{ color: textColor }}
        >
          X
        </button>
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
            readOnly
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default ToastNode;