import { Handle, Position } from 'reactflow';
import styles from './ChatNodes.module.css';
import useStore from '../store';

function FormNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodeData = useStore((state) => state.updateNodeData);

  // --- 💡 추가된 부분: Form Element 미리보기 렌더링 함수 ---
  const renderElementPreview = (element) => {
    switch (element.type) {
      case 'input':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>{element.label || 'Input'}</label>
            <input
              type="text"
              className={styles.previewInput}
              placeholder={element.placeholder || ''}
              readOnly
            />
          </div>
        );
      case 'date':
        return (
           <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>{element.label || 'Date'}</label>
            <input type="date" className={styles.previewInput} readOnly />
          </div>
        );
      case 'grid':
         return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>Grid ({element.columns || 2} columns)</label>
            <div className={styles.previewGrid}>
              {[...Array(element.columns || 2)].map((_, i) => <div key={i}>Item</div>)}
            </div>
          </div>
        );
      case 'checkbox':
      case 'dropbox':
         return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>{element.label || element.type}</label>
            <div className={styles.previewBox}>Options...</div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className={`${styles.nodeWrapper} ${styles.formNodeWrapper}`}>
      <Handle type="target" position={Position.Left} />
      <div className={`${styles.nodeHeader} ${styles.headerForm}`}>
        <span className={styles.headerTextContent}>Form</span>
        <button onClick={() => deleteNode(id)} className={styles.deleteButton}>🗑️</button>
      </div>
      <div className={styles.nodeBody}>
        {/* --- 💡 수정된 부분: Form Title 입력 필드 --- */}
        <div className={styles.section}>
          <input
            className={`${styles.textInput} ${styles.formTitleInput}`}
            value={data.title}
            onChange={(e) => updateNodeData(id, { title: e.target.value })}
            placeholder="Form Title"
          />
        </div>
        {/* --- 💡 수정된 부분: Form 미리보기 영역 --- */}
        <div className={styles.formPreview}>
          {data.elements && data.elements.length > 0
            ? data.elements.map(renderElementPreview)
            : <div className={styles.formElementsPlaceholder}>No elements added yet.</div>
          }
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default FormNode;