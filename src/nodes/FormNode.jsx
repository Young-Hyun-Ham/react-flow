import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function FormNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);

  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerForm}`}>
        <span className={styles.headerTextContent}>Type: Form</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Form Title</span>
          <input
            className={styles.textInput}
            defaultValue={data.title}
            readOnly
          />
        </div>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Elements</span>
          <div className={styles.formElementsPlaceholder}>
            {data.elements && data.elements.length > 0
              ? `${data.elements.length} element(s) configured.`
              : 'No elements added yet.'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default FormNode;
