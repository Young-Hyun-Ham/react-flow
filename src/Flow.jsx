import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import EditableNode from './EditableNode'; // EditableNode.jsx가 같은 폴더에 있다고 가정

// 새 노드의 고유 ID 생성을 위한 카운터
let nodeIdCounter = 3;

function Flow() {
  const nodeTypes = useMemo(() => ({ editableNode: EditableNode }), []);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const handleNodeChange = useCallback((id, newLabel) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const initialNodes = [
    {
      id: '1',
      type: 'editableNode',
      position: { x: 100, y: 100 },
      data: { label: '노드 1 (더블클릭)', onChange: handleNodeChange },
    },
    {
      id: '2',
      type: 'editableNode',
      position: { x: 100, y: 200 },
      data: { label: '노드 2 (수정 가능)', onChange: handleNodeChange },
    },
  ];
  const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

  useState(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, []);

  // --- 추가된 부분: 노드 추가 함수 ---
  const addNode = useCallback(() => {
    const newNodeId = `${nodeIdCounter++}`;
    const newNode = {
      id: newNodeId,
      type: 'editableNode',
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: `새 노드 ${newNodeId}`,
        onChange: handleNodeChange,
      },
    };
    setNodes((currentNodes) => [...currentNodes, newNode]);
  }, [handleNodeChange]);

  // --- 추가된 부분: 마지막 노드 삭제 함수 ---
  const deleteNode = useCallback(() => {
    // 배열의 마지막 노드를 제거하는 간단한 예시
    setNodes((currentNodes) => currentNodes.slice(0, -1));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => {
        const lastNodeId = nodes[nodes.length - 1]?.id;
        return edge.source !== lastNodeId && edge.target !== lastNodeId;
      })
    );
  }, [nodes]);


  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* --- 추가된 부분: 버튼 UI --- */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 4, display: 'flex', gap: '10px' }}>
        <button onClick={addNode} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          노드 추가 ➕
        </button>
        <button onClick={deleteNode} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          노드 삭제 ➖
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

export default Flow;