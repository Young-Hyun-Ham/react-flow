import styles from './ApiDocs.module.css';

function ApiDocs() {
  const nodeStructure = `{
  "id": "string",         // 노드의 고유 ID
  "type": "string",       // 노드 유형 (예: "message", "form", "api")
  "position": {           // 캔버스 내 노드의 위치
    "x": "number",
    "y": "number"
  },
  "data": { ... },        // 노드 유형에 따른 데이터 객체
  "width": "number",        // 노드의 너비
  "height": "number"        // 노드의 높이
}`;

  const edgeStructure = `{
  "id": "string",         // 엣지(연결선)의 고유 ID
  "source": "string",     // 시작 노드의 ID
  "target": "string",     // 끝 노드의 ID
  "sourceHandle": "string | null" // 시작 노드의 특정 핸들 ID
}`;

  const requestBodyExample = `{
  "name": "예약 시나리오 (수정)",
  "nodes": [
    {
      "id": "message-1",
      "type": "message",
      "position": { "x": 100, "y": 100 },
      "data": {
        "content": "안녕하세요! 무엇을 도와드릴까요?",
        "replies": [
          { "display": "예약하기", "value": "val_1" },
          { "display": "문의하기", "value": "val_2" }
        ]
      },
      "width": 250,
      "height": 180
    },
    {
      "id": "form-2",
      "type": "form",
      "position": { "x": 400, "y": 100 },
      "data": {
        "title": "예약 정보 입력",
        "elements": [
          {
            "id": "input-1",
            "type": "input",
            "name": "customerName",
            "label": "이름",
            "placeholder": "성함을 입력해주세요",
            "validation": { "type": "text" }
          }
        ]
      },
      "width": 320,
      "height": 200
    }
  ],
  "edges": [
    {
      "id": "reactflow__edge-message-1-form-2",
      "source": "message-1",
      "target": "form-2",
      "sourceHandle": null
    }
  ]
}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>시나리오 API 명세서 (FastAPI)</h1>
        <p>
          이 문서는 FastAPI 백엔드 서버를 기반으로 한 챗봇 시나리오 관리 API를
          설명합니다. Base URL: <code>/api/v1</code>
        </p>
      </header>

      {/* --- GET /api/v1/scenarios --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          <span className={styles.path}>/scenarios</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>전체 시나리오 목록 조회</h2>
          <p>서버에 저장된 모든 시나리오의 메타데이터 목록을 가져옵니다.</p>
          <dl>
            <dt>응답 (200 OK):</dt>
            <dd>
              <pre>{`[
  {
    "id": "string",
    "name": "string",
    "updated_at": "datetime"
  },
  ...
]`}</pre>
            </dd>
          </dl>
        </div>
      </section>

      {/* --- GET /api/v1/scenarios/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          <span className={styles.path}>/scenarios/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>특정 시나리오 상세 조회</h2>
          <p>
            특정 `scenario_id`에 해당하는 시나리오의 상세 데이터(`nodes`, `edges`)를
            가져옵니다.
          </p>
          <dl>
            <dt>경로 파라미터:</dt>
            <dd><code>scenario_id (string, required)</code>: 조회할 시나리오의 고유 ID</dd>
            <dt>응답 (200 OK):</dt>
            <dd>
              <pre>{`{
  "id": "string",
  "name": "string",
  "nodes": Array<Node>,
  "edges": Array<Edge>,
  "created_at": "datetime",
  "updated_at": "datetime"
}`}</pre>
              <h4>Node 객체 구조:</h4>
              <pre>{nodeStructure}</pre>
              <h4>Edge 객체 구조:</h4>
              <pre>{edgeStructure}</pre>
            </dd>
            <dt>응답 (404 Not Found):</dt>
            <dd><pre>{`{ "detail": "Scenario not found" }`}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- POST /api/v1/scenarios --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.post}`}>POST</span>
          <span className={styles.path}>/scenarios</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>새 시나리오 생성</h2>
          <p>
            새로운 시나리오를 생성합니다. 초기 `nodes`와 `edges`는 비어있는 배열로 생성됩니다.
          </p>
          <dl>
            <dt>요청 본문:</dt>
            <dd><pre>{`{
  "name": "string (required)"
}`}</pre>
            </dd>
            <dt>응답 (201 Created):</dt>
            <dd>
              <pre>{`{
  "id": "string",
  "name": "string",
  "nodes": [],
  "edges": [],
  "created_at": "datetime",
  "updated_at": "datetime"
}`}</pre>
            </dd>
            <dt>응답 (409 Conflict):</dt>
            <dd><pre>{`{ "detail": "Scenario with this name already exists" }`}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- PUT /api/v1/scenarios/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.put}`}>PUT</span>
          <span className={styles.path}>/scenarios/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 전체 업데이트</h2>
          <p>
            지정된 시나리오의 `nodes`와 `edges` 데이터를 덮어쓰기하여 저장합니다. 이름도 함께 변경할 수 있습니다.
          </p>
          <dl>
            <dt>경로 파라미터:</dt>
            <dd><code>scenario_id (string, required)</code>: 업데이트할 시나리오의 고유 ID</dd>
            <dt>요청 본문:</dt>
            <dd>
              <pre>{`{
  "name": "string (optional)",
  "nodes": Array<Node> (required),
  "edges": Array<Edge> (required)
}`}</pre>
            </dd>
            {/* 💡 --- 추가된 부분 --- 💡 */}
            <dt>요청 본문 예시:</dt>
            <dd>
              <pre>{requestBodyExample}</pre>
            </dd>
            {/* 💡 --- 여기까지 --- 💡 */}
            <dt>응답 (200 OK):</dt>
            <dd>업데이트된 전체 시나리오 객체</dd>
            <dt>응답 (404 Not Found):</dt>
            <dd><pre>{`{ "detail": "Scenario not found" }`}</pre></dd>
          </dl>
        </div>
      </section>
      
      {/* --- PATCH /api/v1/scenarios/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.patch}`}>PATCH</span>
          <span className={styles.path}>/scenarios/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 부분 수정 (이름 변경 등)</h2>
          <p>
            시나리오의 일부 정보(예: 이름)를 수정합니다.
          </p>
          <dl>
             <dt>경로 파라미터:</dt>
            <dd><code>scenario_id (string, required)</code>: 수정할 시나리오의 고유 ID</dd>
            <dt>요청 본문:</dt>
            <dd><code>{`{ "name": "string" }`}</code></dd>
            <dt>응답 (200 OK):</dt>
            <dd>업데이트된 전체 시나리오 객체</dd>
            <dt>응답 (404 Not Found):</dt>
            <dd><pre>{`{ "detail": "Scenario not found" }`}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- DELETE /api/v1/scenarios/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.delete}`}>DELETE</span>
          <span className={styles.path}>/scenarios/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 삭제</h2>
          <p>
            지정된 시나리오를 영구적으로 삭제합니다.
          </p>
          <dl>
            <dt>경로 파라미터:</dt>
            <dd><code>scenario_id (string, required)</code>: 삭제할 시나리오의 고유 ID</dd>
            <dt>응답 (204 No Content):</dt>
            <dd>성공 시 본문 없음</dd>
            <dt>응답 (404 Not Found):</dt>
            <dd><pre>{`{ "detail": "Scenario not found" }`}</pre></dd>
          </dl>
        </div>
      </section>
    </div>
  );
}

export default ApiDocs;