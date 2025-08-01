import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store'; // 1. Zustand 스토어를 import 합니다.

function TextNode({ id, data }) { // props에서 id와 data를 받습니다.
  // 2. 스토어에서 필요한 액션을 가져옵니다.
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodeContent = useStore((state) => state.updateNodeContent);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerText}`}>
        <span className={styles.headerTextContent}>Type: text</span>
        {/* 3. 버튼 클릭 시 스토어의 deleteNode 액션을 직접 호출합니다. */}
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{data.id || 'ID'}</span>
          <textarea
            className={styles.textInput}
            defaultValue={data.content}
            // 4. 내용 변경 시 스토어의 updateNodeContent 액션을 호출합니다.
            onChange={(evt) => updateNodeContent(id, evt.target.value)}
            rows={3}
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Replies:</span>
          <button className={styles.addReplyButton}>Add Reply</button>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export default TextNode;