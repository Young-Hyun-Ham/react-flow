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

function FormNode({ id, data }) {
  const deleteNode = useStore((state) => state.deleteNode);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const nodeColor = useStore((state) => state.nodeColors.form);
  const textColor = useStore((state) => state.nodeTextColors.form);
  // const textColor = getTextColorByBackgroundColor(nodeColor);

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
            <input type="text" className={styles.previewInput} placeholder="YYYY-MM-DD" readOnly />
          </div>
        );
      case 'grid':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>{element.label || 'Grid'}</label>
            <table className={styles.previewGridTable}>
              <tbody>
                {[...Array(element.rows || 2)].map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {[...Array(element.columns || 2)].map((_, colIndex) => {
                      const cellIndex = rowIndex * (element.columns || 2) + colIndex;
                      return (
                        <td key={colIndex}>
                          {element.data[cellIndex] || ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'checkbox':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>{element.label || 'Checkbox'}</label>
            <div className={styles.previewOptionsContainer}>
              {(element.options && element.options.length > 0 ? element.options : ['Option 1', 'Option 2']).map((opt, i) => (
                <div key={i} className={styles.previewCheckbox}>
                  <input type="checkbox" id={`${element.id}-${i}`} checked={false} readOnly />
                  <label htmlFor={`${element.id}-${i}`}>{opt}</label>
                </div>
              ))}
            </div>
          </div>
        );
      case 'dropbox':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>{element.label || 'Dropbox'}</label>
            <select className={styles.previewInput} disabled>
              {(element.options && element.options.length > 0 ? element.options : ['Option 1', 'Option 2']).map((opt, i) => (
                <option key={i}>{opt}</option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className={`${styles.nodeWrapper} ${styles.formNodeWrapper}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader} style={{ backgroundColor: nodeColor, color: textColor }}>
        <span className={styles.headerTextContent}>Form</span>
        {/* --- 💡 수정된 부분: onClick 핸들러에 e.stopPropagation() 추가 --- */}
        <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className={styles.deleteButton} style={{ backgroundColor: nodeColor, color: textColor }}>X</button>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.section}>
          <input
            className={`${styles.textInput} ${styles.formTitleInput}`}
            value={data.title}
            onChange={(e) => updateNodeData(id, { title: e.target.value })}
            readOnly
            placeholder="Form Title"
          />
        </div>
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