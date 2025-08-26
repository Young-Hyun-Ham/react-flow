import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function LlmNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const nodeColor = useStore((state) => state.nodeColors.llm);
  const textColor = useStore((state) => state.nodeTextColors.llm);

  return (
    <div className={styles.nodeWrapper}>
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
            rows={4}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default LlmNode;