import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';
import { AnchorIcon } from '../components/Icons';

function LlmNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const anchorNodeId = useStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useStore((state) => state.setAnchorNodeId);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const nodeColor = useStore((state) => state.nodeColors.llm);
  const textColor = useStore((state) => state.nodeTextColors.llm);

  const isAnchored = anchorNodeId === id;

  const onOutputVarChange = (e) => {
    updateNodeData(id, { outputVar: e.target.value });
  };

  return (
    <div className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>LLM</span>
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
            onChange={onOutputVarChange} // This is handled in NodeController, but let's keep it for potential direct use
            readOnly // Controller에서 수정하므로 readOnly로 변경
          />
        </div>
        {/* ▼▼▼▼▼ 조건 분기 표시 UI 추가 ▼▼▼▼▼ */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Conditions:</span>
          <div className={styles.branchOptionsContainer}>
            {data.conditions?.map((cond, index) => (
              <div key={cond.id} className={styles.branchOption}>
                <span className={styles.branchOptionButton}>{cond.keyword}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={cond.id}
                  style={{ top: `${(index / (data.conditions.length + 1)) * 100 + (1 / (data.conditions.length + 1) * 50)}%`, background: '#555' }}
                />
              </div>
            ))}
          </div>
        </div>
        {/* ▲▲▲▲▲ 조건 분기 표시 UI 추가 ▲▲▲▲▲ */}
      </div>

      {/* 기본 출력 핸들 */}
      <Handle
        type="source"
        position={Position.Right}
        id="default"
        style={{ bottom: 15, top: 'auto', background: '#e74c3c' }}
      />
       <div style={{ position: 'absolute', bottom: 10, right: -45, fontSize: '11px', color: '#e74c3c' }}>
        Default
      </div>
    </div>
  );
}

export default LlmNode;