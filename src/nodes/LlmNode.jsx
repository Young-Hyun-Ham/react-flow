import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function LlmNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodeData = useStore((state) => state.updateNodeData); // 이전 단계에서 추가
  const nodeColor = useStore((state) => state.nodeColors.llm);
  const textColor = useStore((state) => state.nodeTextColors.llm);

  const onOutputVarChange = (e) => {
    updateNodeData(id, { outputVar: e.target.value });
  };

  return (
    <div className={styles.nodeWrapper}>
      {/* 입력 핸들 (좌측) */}
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>LLM</span>
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
      </div>
      
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Prompt</span>
          <textarea
            className={styles.textInput}
            value={data.prompt}
            readOnly
            rows={3}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Output Variable</span>
          <input
            type="text"
            className={styles.textInput}
            value={data.outputVar || ''}
            onChange={onOutputVarChange}
          />
        </div>
      </div>

      {/* ▼▼▼▼▼ 수정된 출력 핸들 (우측) ▼▼▼▼▼ */}
      {/* 1. 배열(Array) 타입일 경우의 출력 핸들 */}
      <div style={{ position: 'absolute', top: '22%', right: -33, fontSize: '11px', color: '#555' }}>
        Array
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="array" // 배열 경로를 위한 고유 ID
        style={{ top: '25%' }}
      />

      {/* 2. 그 외(Other) 타입일 경우의 출력 핸들 */}
      <div style={{ position: 'absolute', bottom: '30%', right: -35, fontSize: '11px', color: '#555' }}>
        Other
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="other" // 그 외 경로를 위한 고유 ID
        style={{ bottom: '30%', top: 'auto' }}
      />
      {/* ▲▲▲▲▲ 수정된 출력 핸들 (우측) ▲▲▲▲▲ */}

    </div>
  );
}

export default LlmNode;