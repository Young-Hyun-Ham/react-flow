import { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';

// 이 컴포넌트는 React Flow의 'data' prop과 'id'를 받습니다.
// data.label: 노드에 표시될 텍스트
// data.onChange: 텍스트가 변경될 때 호출될 함수 (부모로부터 받음)
function EditableNode({ id, data }) {
  const [isEditing, setIsEditing] = useState(false);

  // input 값이 변경될 때마다 부모의 상태를 업데이트하는 함수
  const onChange = useCallback((evt) => {
    // 부모로부터 받은 onChange 함수를 호출하여 전체 노드 데이터 업데이트
    data.onChange(id, evt.target.value);
  }, [id, data]);

  // input 포커스가 사라지거나 Enter 키를 누르면 편집 모드 종료
  const onBlur = () => setIsEditing(false);
  const onKeyDown = (evt) => {
    if (evt.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <div style={{ border: '1px solid #777', padding: '10px', borderRadius: '5px', background: 'white', color: 'black' }}>
      {/* 연결 핸들 (엣지가 시작되고 끝나는 점) */}
      <Handle type="target" position={Position.Top} />

      {/* 더블클릭 이벤트 핸들러 */}
      <div onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <input
            type="text"
            defaultValue={data.label} // defaultValue 사용으로 초기값 설정
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus // 편집 모드 시작 시 자동으로 포커스
            style={{ width: '100%' }}
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