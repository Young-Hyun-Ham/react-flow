import { useState, useEffect, useCallback } from 'react';
import styles from './ChatbotSimulator.module.css';

function ChatbotSimulator({ nodes, edges }) {
  const [history, setHistory] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);

  const startSimulation = useCallback(() => {
    const edgeTargets = new Set(edges.map((edge) => edge.target));
    const startNode = nodes.find((node) => !edgeTargets.has(node.id));

    if (startNode) {
      setCurrentNode(startNode);
      // data.content가 없으면 data.label을 사용 (하위 호환성)
      const initialMessage = startNode.data.content || startNode.data.label;
      setHistory([{ type: 'bot', message: initialMessage, node: startNode }]);
    }
  }, [nodes, edges]);

  useEffect(() => {
    startSimulation();
  }, [nodes, edges]); // 노드나 엣지가 변경되면 시뮬레이션 자동 재시작

  const handleOptionClick = (answer, answerIndex) => {
    setHistory((prev) => [...prev, { type: 'user', message: answer }]);

    const sourceHandleId = answer.value || `answer-${answerIndex}`;
    const nextEdge = edges.find(
      (edge) => edge.source === currentNode.id && edge.sourceHandle === sourceHandleId
    );

    if (nextEdge) {
      const nextNode = nodes.find((node) => node.id === nextEdge.target);
      if (nextNode) {
        setCurrentNode(nextNode);
        setTimeout(() => {
          const nextMessage = nextNode.data.content || nextNode.data.label;
          setHistory((prev) => [...prev, { type: 'bot', message: nextMessage, node: nextNode }]);
        }, 500);
      }
    } else {
      setTimeout(() => {
        setHistory((prev) => [...prev, { type: 'bot', message: '대화가 종료되었습니다.' }]);
        setCurrentNode(null);
      }, 500);
    }
  };

  const getOptions = () => {
    if (!currentNode) return [];
    if (currentNode.type === 'confirmation' || currentNode.type === 'slotFilling') {
      return currentNode.data.replies || [];
    }
    return [];
  };

  const options = getOptions();

  return (
    <div className={styles.simulator}>
      <div className={styles.header}>챗봇</div>
      <div className={styles.history}>
        {history.map((item, index) => (
          <div key={index} className={`${styles.messageRow} ${item.type === 'user' ? styles.userRow : ''}`}>
            {item.type === 'bot' && <div className={styles.avatar}>🤖</div>}
            <div
              className={`${styles.message} ${item.type === 'bot' ? styles.botMessage : styles.userMessage}`}
            >
              {item.message}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.options}>
        {options.length > 0 ? (
          options.map((answer, index) => (
            <button key={index} className={styles.optionButton} onClick={() => handleOptionClick(answer, index)}>
              {answer.display}
            </button>
          ))
        ) : (
          <button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>
            대화 다시 시작하기
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatbotSimulator;