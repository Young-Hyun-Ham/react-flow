import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { AnchorIcon, IframeIcon } from '../components/Icons';

function IframeNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const anchorNodeId = useStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useStore((state) => state.setAnchorNodeId);
  const nodeColor = useStore((state) => state.nodeColors.iframe);
  const textColor = useStore((state) => state.nodeTextColors.iframe);

  const isAnchored = anchorNodeId === id;

  return (
    <div className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''}`} style={{width: data.width ? `${parseInt(data.width) + 40}px` : '300px'}}>
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <div className={styles.headerLeft}>
            <IframeIcon />
            <span className={styles.headerTextContent}>iFrame</span>
        </div>
        <div className={styles.headerButtons}>
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