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

function ApiNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const nodeColor = useStore((state) => state.nodeColors.api);
  const textColor = useStore((state) => state.nodeTextColors.api);
//   const textColor = getTextColorByBackgroundColor(nodeColor);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>API</span>
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Method</span>
          <input
            className={styles.textInput}
            value={data.method || 'GET'}
            readOnly
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>URL</span>
          <textarea
            className={styles.textInput}
            value={data.url}
            readOnly
            rows={2}
          />
        </div>
        {/* --- 💡 수정된 부분 시작 --- */}
        {data.responseMapping && data.responseMapping.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Response Mapping</span>
            <div className={styles.previewBox}>
              {data.responseMapping.length} item(s) configured
            </div>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="onSuccess"
        style={{ top: '35%', background: '#2ecc71' }}
      />
      <span style={{ position: 'absolute', right: '-70px', top: '35%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#2ecc71' }}>On Success</span>
      
      <Handle
        type="source"
        position={Position.Right}
        id="onError"
        style={{ top: '65%', background: '#e74c3c' }}
      />
      <span style={{ position: 'absolute', right: '-60px', top: '65%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#e74c3c' }}>On Error</span>
      {/* --- 💡 수정된 부분 끝 --- */}
    </div>
  );
}
export default ApiNode;