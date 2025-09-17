import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

// Iframe 아이콘 SVG 컴포넌트
const IframeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M2 9h20" />
        <path d="M9 2v2" />
        <path d="M15 2v2" />
    </svg>
);


function IframeNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const nodeColor = useStore((state) => state.nodeColors.iframe);
  const textColor = useStore((state) => state.nodeTextColors.iframe);

  return (
    <div className={styles.nodeWrapper} style={{width: data.width ? `${parseInt(data.width) + 40}px` : '300px'}}>
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <div className={styles.headerLeft}>
            <IframeIcon />
            <span className={styles.headerTextContent}>iFrame</span>
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
          <span className={styles.sectionTitle}>URL</span>
          <textarea
            className={styles.textInput}
            value={data.url || ''}
            readOnly
            rows={2}
          />
        </div>
        <div className={styles.section}>
            <iframe
                src={data.url}
                width={data.width || '100%'}
                height={data.height || '200'}
                style={{ border: '1px solid #ccc', borderRadius: '4px' }}
                title="iframe-preview"
            ></iframe>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default IframeNode;