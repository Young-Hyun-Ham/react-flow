import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

// --- 💡 추가된 부분: Play 아이콘 ---
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-14 9V3z"></path>
  </svg>
);

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
  // --- 💡 추가된 부분 시작 ---
  const slots = useStore((state) => state.slots);

  const interpolateMessage = (message, slots) => {
    if (!message) return '';
    return message.replace(/\{([^}]+)\}/g, (match, key) => {
      return slots.hasOwnProperty(key) ? slots[key] : match;
    });
  };

  const handleApiTest = async (e) => {
    e.stopPropagation();
    try {
      const { method, url, headers, body } = data;
      
      const interpolatedUrl = interpolateMessage(url, slots);
      const interpolatedHeaders = JSON.parse(interpolateMessage(headers || '{}', slots));
      const interpolatedBody = method !== 'GET' && body ? interpolateMessage(body, slots) : undefined;

      const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...interpolatedHeaders
        },
        body: interpolatedBody,
      };

      const response = await fetch(interpolatedUrl, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}\n${JSON.stringify(result, null, 2)}`);
      }

      alert(`API Test Success!\n\nResponse:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error("API Test Error:", error);
      alert(`API Test Failed:\n${error.message}`);
    }
  };
  // --- 💡 추가된 부분 끝 ---

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>API</span>
        {/* --- 💡 수정된 부분 시작 --- */}
        <div className={styles.headerButtons}>
            <button onClick={handleApiTest} className={styles.playButton} title="Test API" style={{ color: textColor }}>
                <PlayIcon />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
        </div>
        {/* --- 💡 수정된 부분 끝 --- */}
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
    </div>
  );
}
export default ApiNode;