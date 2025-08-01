import { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
// 1. CSS 모듈을 import 합니다.
import styles from './EditableNode.module.css';

function EditableNode({ id, data }) {
  const [isEditing, setIsEditing] = useState(false);

  const onChange = useCallback((evt) => {
    data.onChange(id, evt.target.value);
  }, [id, data]);

  const onBlur = () => setIsEditing(false);
  const onKeyDown = (evt) => {
    if (evt.key === 'Enter') {
      setIsEditing(false);
    }
  };

  const onDeleteClick = useCallback(() => {
    data.onDelete(id);
  }, [id, data]);

  return (
    // 2. 인라인 style을 className으로 교체합니다.
    <div className={styles.node}>
      <button
        onClick={onDeleteClick}
        className={styles.deleteButton}
        title="삭제"
      >
        ×
      </button>

      <Handle type="target" position={Position.Top} />

      <div onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <input
            type="text"
            defaultValue={data.label}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            className={styles.input} // input에도 className 적용
          />
        ) : (
          <div>{data.label}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default EditableNode;