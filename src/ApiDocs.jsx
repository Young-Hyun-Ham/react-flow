import styles from './ApiDocs.module.css';

function ApiDocs() {
  const nodeStructure = `{
  "id": "string",         // 노드의 고유 ID
  "type": "string",       // 노드 유형 (예: "message", "form", "api")
  "position": {           // 캔버스 내 노드의 위치
    "x": "number",
    "y": "number"
  },
  "data": { ... },        // 노드 유형에 따른 데이터 객체 (JSON 스키마는 SCENARIO_SCHEMA.md 참고)
  "width": "number",        // 노드의 너비
  "height": "number"        // 노드의 높이
}`; //

  const edgeStructure = `{
  "id": "string",             // 엣지(연결선)의 고유 ID
  "source": "string",         // 시작 노드의 ID
  "target": "string",         // 끝 노드의 ID
  "sourceHandle": "string | null" // 시작 노드의 특정 핸들 ID (예: "onSuccess", "onError", 조건 ID 등)
}`; //

  const requestBodyExample = `{
  "ten_id": "1000",
  "stg_id": "DEV",
  "category_id": "DEV_1000_S_1_1_1", // 필요시 수정
  "name": "예약 시나리오 (수정)",
  "job": "Process", // "Batch", "Process", "Long Transaction" 중 하나
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
    // ... 다른 노드들
  ],
  "edges": [
    {
      "id": "reactflow__edge-message-1-form-2",
      "source": "message-1",
      "target": "form-2",
      "sourceHandle": null
    },
    // ... 다른 엣지들
  ],
  "start_node_id": "message-1" // 시뮬레이션 시작 노드 ID (nullable)
}`; //

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>시나리오 API 명세서 (FastAPI)</h1>
        <p>
          FastAPI 백엔드 서버 기반 챗봇 시나리오 관리 API 명세입니다.
          {/* --- 👇 [수정] Base URL 경로 업데이트 --- */}
          Base URL: <code>/api/v1/chat/scenarios/{'{tenant_id}'}/{'{stage_id}'}</code> (예: <code>/api/v1/chat/scenarios/1000/DEV</code>)
          {/* --- 👆 [수정 끝] --- */}
        </p>
      </header>

      {/* --- GET /api/v1/chat/scenarios/{tenant_id}/{stage_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          {/* --- 👇 [수정] 경로 업데이트 --- */}
          <span className={styles.path}>/{'{tenant_id}'}/{'{stage_id}'}</span>
          {/* --- 👆 [수정 끝] --- */}
        </div>
        <div className={styles.endpointBody}>
          <h2>전체 시나리오 목록 조회</h2>
          <p>지정된 tenant 및 stage에 속한 모든 시나리오의 메타데이터 목록을 가져옵니다.</p>
          <dl>
             <dt>경로 파라미터:</dt>
            <dd><code>tenant_id (string, required)</code>: 테넌트 ID (예: "1000")</dd>
            <dd><code>stage_id (string, required)</code>: 스테이지 ID (예: "DEV")</dd>
            <dt>응답 (200 OK):</dt>
            <dd>
              {/* --- 👇 [수정] 응답 구조 및 job 필드 추가 --- */}
              <pre>{`{
  "scenarios": [ // 또는 최상위가 배열일 수 있음
    {
      "id": "string",         // 시나리오 고유 ID
      "name": "string",       // 시나리오 이름
      "job": "string | null", // Job 타입 ("Batch", "Process", "Long Transaction")
      "created_at": "datetime",
      "updated_at": "datetime"
    },
    ...
  ]
}`}</pre> //
              <p>참고: 응답의 `job` 필드가 `null`이거나 없는 경우, 클라이언트에서는 'Process'로 간주합니다.</p>
              {/* --- 👆 [수정 끝] --- */}
            </dd>
          </dl>
        </div>
      </section>

      {/* --- GET /api/v1/chat/scenarios/{tenant_id}/{stage_id}/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
           {/* --- 👇 [수정] 경로 업데이트 --- */}
          <span className={styles.path}>/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
           {/* --- 👆 [수정 끝] --- */}
        </div>
        <div className={styles.endpointBody}>
          <h2>특정 시나리오 상세 조회</h2>
          <p>
            특정 `scenario_id`에 해당하는 시나리오의 상세 데이터(`nodes`, `edges`, `start_node_id` 등)를 가져옵니다.
          </p>
          <dl>
            <dt>경로 파라미터:</dt>
            <dd><code>tenant_id (string, required)</code></dd>
            <dd><code>stage_id (string, required)</code></dd>
            <dd><code>scenario_id (string, required)</code>: 조회할 시나리오의 고유 ID</dd>
            <dt>응답 (200 OK):</dt>
            <dd>
              {/* --- 👇 [수정] 응답 구조에 job, start_node_id 추가 --- */}
              <pre>{`{
  "id": "string",
  "name": "string",
  "job": "string",        // Job 타입
  "nodes": Array<Node>,   // Node 객체 배열
  "edges": Array<Edge>,   // Edge 객체 배열
  "start_node_id": "string | null", // 시작 노드 ID
  "created_at": "datetime",
  "updated_at": "datetime"
}`}</pre> //
              {/* --- 👆 [수정 끝] --- */}
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

      {/* --- POST /api/v1/chat/scenarios/{tenant_id}/{stage_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.post}`}>POST</span>
          {/* --- 👇 [수정] 경로 업데이트 --- */}
          <span className={styles.path}>/{'{tenant_id}'}/{'{stage_id}'}</span>
          {/* --- 👆 [수정 끝] --- */}
        </div>
        <div className={styles.endpointBody}>
          <h2>새 시나리오 생성 또는 복제</h2>
          <p>
            새로운 시나리오를 생성하거나, `clone_from_id`를 제공하여 기존 시나리오를 복제합니다.
          </p>
          <dl>
             <dt>경로 파라미터:</dt>
            <dd><code>tenant_id (string, required)</code></dd>
            <dd><code>stage_id (string, required)</code></dd>
            <dt>요청 본문 (신규 생성):</dt>
            {/* --- 👇 [수정] 요청 본문 구조 업데이트 (job, category_id, start_node_id 추가) --- */}
            <dd><pre>{`{
  "name": "string (required)",     // 새 시나리오 이름
  "job": "string (required)",      // Job 타입 ("Batch", "Process", "Long Transaction")
  "category_id": "string (optional)", // 카테고리 ID (예: "DEV_1000_S_1_1_1")
  "nodes": [],                    // 빈 배열
  "edges": [],                    // 빈 배열
  "start_node_id": null          // null
}`}</pre></dd> //
            <dt>요청 본문 (복제):</dt>
             <dd><pre>{`{
  "name": "string (required)",     // 복제될 시나리오의 새 이름
  "job": "string (required)",      // 복제될 시나리오의 Job 타입
  "clone_from_id": "string (required)", // 복제할 원본 시나리오 ID
  "category_id": "string (optional)"  // 카테고리 ID
}`}</pre></dd> //
             {/* --- 👆 [수정 끝] --- */}
            <dt>응답 (201 Created):</dt>
            <dd>
              {/* --- 👇 [수정] 응답 구조 업데이트 --- */}
              <pre>{`{
  "id": "string",
  "name": "string",
  "job": "string",
  "nodes": Array<Node>, // 복제 시 원본 nodes, 신규 시 []
  "edges": Array<Edge>, // 복제 시 원본 edges, 신규 시 []
  "start_node_id": "string | null", // 복제 시 원본 start_node_id, 신규 시 null
  "created_at": "datetime",
  "updated_at": "datetime"
}`}</pre> //
              {/* --- 👆 [수정 끝] --- */}
            </dd>
            <dt>응답 (409 Conflict):</dt>
            <dd><pre>{`{ "detail": "Scenario with this name already exists" }`}</pre></dd>
            <dd><pre>{`{ "detail": "Scenario to clone from not found" }`}</pre> (복제 시)</dd>
          </dl>
        </div>
      </section>

      {/* --- PUT /api/v1/chat/scenarios/{tenant_id}/{stage_id}/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.put}`}>PUT</span>
           {/* --- 👇 [수정] 경로 업데이트 --- */}
          <span className={styles.path}>/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
           {/* --- 👆 [수정 끝] --- */}
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 전체 업데이트</h2>
          <p>
            지정된 시나리오의 전체 데이터(`name`, `job`, `nodes`, `edges`, `start_node_id`)를 덮어쓰기하여 저장합니다.
          </p>
          <dl>
            <dt>경로 파라미터:</dt>
            <dd><code>tenant_id (string, required)</code></dd>
            <dd><code>stage_id (string, required)</code></dd>
            <dd><code>scenario_id (string, required)</code>: 업데이트할 시나리오의 고유 ID</dd>
            <dt>요청 본문:</dt>
            <dd>
              {/* --- 👇 [수정] 요청 본문 구조 업데이트 (전체 필드 포함) --- */}
              <pre>{`{
  "ten_id": "string (required)", // tenant_id와 동일
  "stg_id": "string (required)", // stage_id와 동일
  "category_id": "string (required)", // 카테고리 ID
  "name": "string (required)",       // 시나리오 이름
  "job": "string (required)",        // Job 타입
  "nodes": Array<Node> (required),   // Node 객체 배열
  "edges": Array<Edge> (required),   // Edge 객체 배열
  "start_node_id": "string | null"  // 시작 노드 ID
}`}</pre> //
              {/* --- 👆 [수정 끝] --- */}
            </dd>
            <dt>요청 본문 예시:</dt>
            <dd>
              <pre>{requestBodyExample}</pre>
            </dd>
            <dt>응답 (200 OK):</dt>
             {/* --- 👇 [수정] 응답 구조 업데이트 --- */}
            <dd>업데이트된 전체 시나리오 객체 (GET /scenarios/{'{scenario_id}'} 응답과 동일)</dd>
             {/* --- 👆 [수정 끝] --- */}
            <dt>응답 (404 Not Found):</dt>
            <dd><pre>{`{ "detail": "Scenario not found" }`}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- PATCH /api/v1/chat/scenarios/{tenant_id}/{stage_id}/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.patch}`}>PATCH</span>
           {/* --- 👇 [수정] 경로 업데이트 --- */}
          <span className={styles.path}>/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
           {/* --- 👆 [수정 끝] --- */}
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 부분 수정 (이름, Job 타입)</h2>
          <p>
            시나리오의 이름(`name`) 또는 Job 타입(`job`)을 수정합니다. 둘 중 하나 또는 둘 다 제공할 수 있습니다.
          </p>
          <dl>
             <dt>경로 파라미터:</dt>
            <dd><code>tenant_id (string, required)</code></dd>
            <dd><code>stage_id (string, required)</code></dd>
            <dd><code>scenario_id (string, required)</code>: 수정할 시나리오의 고유 ID</dd>
            <dt>요청 본문:</dt>
            {/* --- 👇 [수정] 요청 본문에 job 추가 --- */}
            <dd><pre>{`{
  "name": "string (optional)",
  "job": "string (optional)"
}`}</pre></dd> //
            {/* --- 👆 [수정 끝] --- */}
            <dt>응답 (200 OK):</dt>
            {/* --- 👇 [수정] 응답 구조 업데이트 --- */}
            <dd>업데이트된 전체 시나리오 객체 (GET /scenarios/{'{scenario_id}'} 응답과 동일)</dd>
            {/* --- 👆 [수정 끝] --- */}
            <dt>응답 (404 Not Found):</dt>
            <dd><pre>{`{ "detail": "Scenario not found" }`}</pre></dd>
             <dt>응답 (409 Conflict):</dt>
            <dd>(이름 변경 시)<pre>{`{ "detail": "Scenario with this name already exists" }`}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- DELETE /api/v1/chat/scenarios/{tenant_id}/{stage_id}/{scenario_id} --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.delete}`}>DELETE</span>
           {/* --- 👇 [수정] 경로 업데이트 --- */}
          <span className={styles.path}>/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
           {/* --- 👆 [수정 끝] --- */}
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 삭제</h2>
          <p>
            지정된 시나리오를 영구적으로 삭제합니다.
          </p>
          <dl>
            <dt>경로 파라미터:</dt>
            <dd><code>tenant_id (string, required)</code></dd>
            <dd><code>stage_id (string, required)</code></dd>
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