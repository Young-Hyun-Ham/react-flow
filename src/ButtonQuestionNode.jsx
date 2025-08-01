import { Handle, Position } from 'reactflow';
import styles from './EditableNode.module.css';

function ButtonQuestionNode({ data }) {
  // data는 { question: '...', answers: ['답변1', '답변2'] } 형태
  const { question, answers = [] } = data;

  return (
    <div className={styles.node} style={{ border: '1px solid #1a192b', background: '#eee' }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ padding: '5px', fontWeight: 'bold' }}>{question}</div>
      <div style={{ marginTop: '10px' }}>
        {answers.map((answer, index) => (
          <div key={index} style={{ position: 'relative', padding: '5px 10px', borderTop: '1px solid #ccc' }}>
            {answer}
            {/* 각 답변(버튼)에 대한 개별 핸들 */}
            <Handle
              type="source"
              // 각 핸들의 위치를 동적으로 계산하여 겹치지 않게 함
              position={Position.Right}
              id={`answer-${index}`} // 핸들의 고유 ID 지정
              style={{ top: `${20 + index * 31}px`, background: '#555' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ButtonQuestionNode;