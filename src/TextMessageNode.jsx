import { Handle, Position } from 'reactflow';
import styles from './EditableNode.module.css'; // 기존 스타일 재활용

function TextMessageNode({ data }) {
  return (
    <div className={styles.node}>
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default TextMessageNode;