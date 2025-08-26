import { useState } from 'react';
import styles from './HelpModal.module.css';

const HelpManual = () => (
<>
 <h2>1. Getting Started</h2>
 <h3>1.1. Login</h3>
 <ul>
 <li>You must log in with a Google account to use the service.</li>
 <li>Only users with <strong>authorized emails and domains</strong>(<code>cyberlogitec.com</code>, <code>wisenut.co.kr</code>) can access the service.</li>
 </ul>
 <h3>1.2. Main Screen</h3>
 <ul>
 <li><strong>Flow Editor</strong>: The main workspace for visually creating and editing chatbot conversation flows.</li>
 <li><strong>Board</strong>: Provides a simple bulletin board feature to help communication between users.</li>
 </ul>

 <h2>2. Scenario Management</h2>
 <p>The first screen you see after login is the <strong>Scenario List</strong>.</p>
 <ul>
 <li><strong>Add New Scenario</strong>: Click the <code>+ Add New Scenario</code> button and enter a scenario name to create a new conversation flow.</li>
 <li><strong>Select Scenario</strong>: Click on a scenario name in the list to navigate to that scenario's editing screen.</li>
 <li><strong>Edit/Delete Scenario</strong>: Use the <code>Edit</code> button next to each scenario item to change the name, or the <code>Delete</code> button to permanently remove the scenario.</li>
 </ul>

 <h2>3. Flow Editor Screen Layout</h2>
 <ol>
 <li><strong>Node Addition Panel (Left)</strong>: Add various types of nodes that make up the scenario to the canvas.</li>
 <li><strong>Canvas (Center)</strong>: Space for placing nodes and connecting them to create actual conversation flows.</li>
 <li><strong>Controller Panel (Right)</strong>: Activated when you select a node on the canvas, allowing you to edit the detailed content of that node.</li>
 <li><strong>Simulator (Right)</strong>: Can be activated by clicking the <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> icon to test how your written scenario works in real-time as an actual chatbot.</li>
 </ol>

 <h2>4. Node Types and Functions</h2>
 <p>Click the desired node from the left panel to add it to the canvas.</p>
  {/* --- 💡 수정된 부분 시작 --- */}
 <table className={styles.table}>
 <thead>
  <tr>
  <th>Node Type</th>
  <th>Description</th>
  </tr>
 </thead>
 <tbody>
  <tr>
  <td><strong>Message</strong></td>
  <td>The most basic text message that the chatbot sends to users. You can add quick reply buttons (Quick Replies).</td>
  </tr>
  <tr>
  <td><strong>Form</strong></td>
  <td>A form for receiving structured data input from users. (e.g., name, date, checkboxes, etc.)</td>
  </tr>
  <tr>
  <td><strong>Condition Branch</strong></td>
  <td>Divides the conversation flow into multiple branches based on user responses.</td>
  </tr>
  <tr>
  <td><strong>SlotFilling</strong></td>
  <td>Used to receive user input and store it in specific variables (Slots).</td>
  </tr>
  <tr>
  <td><strong>API</strong></td>
  <td>Calls an external API. You can use slot values in the request and save parts of the JSON response back into slots. It also allows branching the flow based on API call success or failure.</td>
  </tr>
  <tr>
  <td><strong>LLM</strong></td>
  <td>Connects to a large language model to generate text based on a dynamic prompt.</td>
  </tr>
  <tr>
  <td><strong>Fixed Menu</strong></td>
  <td>Configures a menu that is always exposed at the bottom of the chatbot conversation window. Can be the starting point of a scenario.</td>
  </tr>
  <tr>
  <td><strong>Link</strong></td>
  <td>Delivers external website links to users.</td>
  </tr>
 </tbody>
 </table>
  {/* --- 💡 수정된 부분 끝 --- */}

 <h2>5. Scenario Editing and Testing</h2>
 <h3>5.1. Node Editing</h3>
 <ol>
 <li>Click on the node you want to edit on the canvas.</li>
 <li>Modify the node's text, buttons, form elements, etc. in the <strong>Controller Panel</strong> that appears on the right.</li>
 <li>When editing is complete, click the <code>Save Changes</code> button at the bottom of the controller panel to apply changes to the node.</li>
 </ol>

 <h3>5.2. Using Slots (Variables)</h3>
 <p>Slots are variables used to store and reuse information within a scenario. You can store user input from a <strong>SlotFilling</strong> node or data from an <strong>API</strong> node's response into a slot.</p>
 <p>To use a stored slot value in other nodes (like Message, API, or LLM), use brace notation: <code>{'{slotName}'}</code>.</p>
 <p><strong>Example:</strong> If you stored a user's name in a slot called <code>userName</code>, you can use it in a Message node like this: <code>Hello, {'{userName}'}! Welcome.</code></p>

 <h3>5.3. Using the API Node</h3>
 <p>The API node allows for dynamic interaction with external servers.</p>
 <ul>
 <li><strong>Dynamic Requests</strong>: Use slots to make dynamic API calls. In the URL, Headers, or Body fields, you can insert values from previous user inputs or API responses using brace notation (e.g., <code>https://api.example.com/users/{'{userId}'}</code>).</li>
 <li><strong>Response Mapping</strong>: After a successful API call, you can extract values from the JSON response and save them into new or existing slots. In the "Response Mapping" section of the controller:
  <ul>
  <li><strong>JSON Path</strong>: Specify the path to the desired value in the JSON response (e.g., <code>data.user.name</code>).</li>
  <li><strong>Slot Name</strong>: Enter the name of the slot where you want to store the extracted value (e.g., <code>userName</code>).</li>
  </ul>
 </li>
 <li><strong>Success/Failure Branching</strong>: The API node has two source handles on its right side:
  <ul>
  <li><code>On Success</code>: Drag a connection from this handle to the node that should follow a successful API call.</li>
  <li><code>On Error</code>: Drag a connection from this handle to the node that should follow a failed API call (e.g., network error, server error).</li>
  </ul>
 </li>
 </ul>

 <h3>5.4. Using the LLM Node</h3>
 <p>The LLM node sends a prompt to a large language model and displays the response in a streaming format. You can create dynamic prompts by combining text with slot values.</p>
 <p><strong>Example:</strong></p>
 <ol>
  <li>Create a <strong>SlotFilling</strong> node with the content "What topic are you curious about?" and set the slot name to <code>topic</code>.</li>
  <li>Connect this node to an <strong>LLM</strong> node.</li>
  <li>In the LLM node's controller, set the prompt to: <code>Tell me a short, fun story about {'{topic}'}.</code></li>
  <li>When you test this in the simulator, the value you enter for the topic will be inserted into the prompt sent to the language model.</li>
 </ol>
 
 <h3>5.5. Node Connection</h3>
 <ul>
 <li>Click on the connection points (Handles) on the right or left edges of nodes and drag to other nodes' connection points to connect conversation flows.</li>
 <li><strong>Condition Branch/Fixed Menu/API nodes</strong>: Each button (Branch/Menu) or outcome (Success/Error) has its own separate connection point.</li>
 </ul>

 <h3>5.6. Node and Connection Deletion/Duplication</h3>
 <ul>
 <li><strong>Delete Node</strong>: Click the <code>x</code> button in the top right of the node.</li>
 <li><strong>Delete Connection</strong>: Click only the connection you want to delete on the canvas to select it, then press <code>Backspace</code> or <code>Delete</code> on your keyboard.</li>
 <li><strong>Duplicate Node</strong>: Click the <code>+ Duplicate Node</code> button that appears at the bottom of the left 'Add Node' panel when you select the node you want to duplicate.</li>
 </ul>

 <h3>5.7. Save and Test</h3>
 <ul>
 <li><strong>Save</strong>: Click the <code>Save Scenario</code> button in the top right of the screen to save the current scenario you're working on to the server.</li>
 <li><strong>Test</strong>: Click the <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> icon to open the simulator and test whether the scenario works as intended.</li>
 </ul>
</>
);

const HelpManual_ko = () => (
<>
 <h2>1. 시작하기</h2>
 <h3>1.1. 로그인</h3>
 <ul>
 <li>서비스를 이용하려면 구글 계정으로 로그인해야 합니다.</li>
 <li><strong>허용된 이메일과 도메인</strong>(<code>cyberlogitec.com</code>, <code>wisenut.co.kr</code>)을 가진 사용자만 접근할 수 있습니다.</li>
 </ul>
 <h3>1.2. 메인 화면</h3>
 <ul>
 <li><strong>Flow Editor</strong>: 챗봇 대화 흐름을 시각적으로 만들고 편집하는 기본 작업 공간입니다.</li>
 <li><strong>Board</strong>: 사용자 간 소통을 돕는 간단한 게시판 기능을 제공합니다.</li>
 </ul>

 <h2>2. 시나리오 관리</h2>
 <p>로그인 후 가장 먼저 시나리오 목록 화면이 나타납니다.</p>
 <ul>
 <li><strong>새 시나리오 추가</strong>: <code>+ 새 시나리오 추가</code> 버튼을 클릭하고 시나리오 이름을 입력하여 새로운 대화 흐름을 생성합니다.</li>
 <li><strong>시나리오 선택</strong>: 목록에서 시나리오 이름을 클릭하면 해당 시나리오의 편집 화면으로 이동합니다.</li>
 <li><strong>시나리오 수정/삭제</strong>: 각 항목 옆의 <code>수정</code> 버튼으로 이름을 변경하거나, <code>삭제</code> 버튼으로 시나리오를 영구적으로 제거합니다.</li>
 </ul>

 <h2>3. Flow Editor 화면 구성</h2>
 <ol>
 <li><strong>노드 추가 패널 (좌측)</strong>: 시나리오를 구성하는 다양한 종류의 노드를 캔버스에 추가합니다.</li>
 <li><strong>캔버스 (중앙)</strong>: 노드를 배치하고 연결하여 실제 대화 흐름을 구성하는 공간입니다.</li>
 <li><strong>컨트롤러 패널 (우측)</strong>: 캔버스에서 노드를 선택하면 활성화되며, 해당 노드의 세부 내용을 편집할 수 있습니다.</li>
 <li><strong>시뮬레이터 (우측)</strong>: <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> 아이콘을 클릭하여 활성화할 수 있으며, 작성한 시나리오가 실제 챗봇처럼 동작하는지 실시간으로 테스트할 수 있습니다.</li>
 </ol>

 <h2>4. 노드 종류 및 기능</h2>
 <p>좌측 패널에서 원하는 노드를 클릭하여 캔버스에 추가하세요.</p>
  {/* --- 💡 수정된 부분 시작 --- */}
 <table className={styles.table}>
 <thead>
  <tr>
  <th>노드<br />종류</th>
  <th>설명</th>
  </tr>
 </thead>
 <tbody>
  <tr>
  <td><strong>메시지</strong></td>
  <td>챗봇이 사용자에게 보내는 가장 기본적인 텍스트 메시지입니다. 빠른 답장 버튼(Quick Replies)을 추가할 수 있습니다.</td>
  </tr>
  <tr>
  <td><strong>폼</strong></td>
  <td>사용자로부터 정형화된 데이터 입력을 받기 위한 양식입니다. (예: 이름, 날짜, 체크박스 등)</td>
  </tr>
  <tr>
  <td><strong>조건<br />분기</strong></td>
  <td>사용자의 답변에 따라 대화 흐름을 여러 갈래로 나눕니다.</td>
  </tr>
  <tr>
  <td><strong>슬롯<br />채우기</strong></td>
  <td>사용자 입력을 받아 특정 변수(Slot)에 저장하는 데 사용됩니다.</td>
  </tr>
  <tr>
  <td><strong>API</strong></td>
  <td>외부 API를 호출합니다. 요청 시 슬롯 값을 사용할 수 있으며, JSON 응답의 일부를 다시 슬롯에 저장할 수 있습니다. API 호출 성공/실패에 따라 흐름을 분기할 수도 있습니다.</td>
  </tr>
  <tr>
  <td><strong>LLM</strong></td>
  <td>거대 언어 모델과 연동하여 동적인 프롬프트를 기반으로 텍스트를 생성합니다.</td>
  </tr>
  <tr>
  <td><strong>고정 메뉴</strong></td>
  <td>챗봇 대화창 하단에 항상 노출되는 메뉴를 설정합니다. 시나리오의 시작점이 될 수 있습니다.</td>
  </tr>
  <tr>
  <td><strong>링크</strong></td>
  <td>외부 웹사이트 링크를 사용자에게 전달합니다.</td>
  </tr>
 </tbody>
 </table>
  {/* --- 💡 수정된 부분 끝 --- */}

 <h2>5. 시나리오 편집 및 테스트</h2>
 <h3>5.1. 노드 편집</h3>
 <ol>
 <li>캔버스에서 편집하고 싶은 노드를 클릭합니다.</li>
 <li>우측에 나타나는 <strong>컨트롤러 패널</strong>에서 노드의 텍스트, 버튼, 양식 요소 등을 수정합니다.</li>
 <li>편집이 끝나면 컨트롤러 패널 하단의 <code>Save Changes</code> 버튼을 클릭하여 변경 사항을 노드에 적용합니다.</li>
 </ol>

 <h3>5.2. 슬롯(변수) 사용하기</h3>
 <p>슬롯은 시나리오 내에서 정보를 저장하고 재사용하기 위한 변수입니다. <strong>슬롯 채우기</strong> 노드를 통해 받은 사용자 입력이나 <strong>API</strong> 노드의 응답 데이터 등을 슬롯에 저장할 수 있습니다.</p>
 <p>저장된 슬롯 값은 다른 노드(메시지, API, LLM 등)에서 중괄호 표기법(<code>{'{슬롯이름}'}</code>)을 사용하여 불러올 수 있습니다.</p>
 <p><strong>예시:</strong> <code>userName</code>이라는 슬롯에 사용자 이름을 저장했다면, 메시지 노드에서 <code>안녕하세요, {'{userName}'}님!</code> 과 같이 사용할 수 있습니다.</p>

 <h3>5.3. API 노드 사용하기</h3>
 <p>API 노드를 사용하면 외부 서버와 동적으로 상호작용할 수 있습니다.</p>
 <ul>
 <li><strong>동적 요청</strong>: 슬롯을 사용하여 동적인 API를 호출할 수 있습니다. URL, Headers, Body 필드에 중괄호 표기법(예: <code>https://api.example.com/users/{'{userId}'}</code>)을 사용하여 이전 사용자 입력이나 다른 API 응답 값을 삽입할 수 있습니다.</li>
 <li><strong>응답 매핑</strong>: API가 성공적으로 호출된 후, JSON 응답에서 특정 값을 추출하여 새 슬롯이나 기존 슬롯에 저장할 수 있습니다. 컨트롤러의 "Response Mapping" 섹션에서 다음을 설정하세요:
  <ul>
  <li><strong>JSON Path</strong>: JSON 응답에서 원하는 값의 경로를 지정합니다 (예: <code>data.user.name</code>).</li>
  <li><strong>Slot Name</strong>: 추출한 값을 저장할 슬롯의 이름을 입력합니다 (예: <code>userName</code>).</li>
  </ul>
 </li>
 <li><strong>성공/실패 분기</strong>: API 노드의 오른쪽에는 두 개의 연결점(Handle)이 있습니다:
  <ul>
  <li><code>On Success</code>: API 호출이 성공했을 때 이어질 노드로 이 연결점에서 선을 드래그하여 연결합니다.</li>
  <li><code>On Error</code>: API 호출이 실패했을 때(예: 네트워크 오류, 서버 에러) 이어질 노드로 이 연결점에서 선을 드래그하여 연결합니다.</li>
  </ul>
 </li>
 </ul>

 <h3>5.4. LLM 노드 사용하기</h3>
 <p>LLM 노드는 거대 언어 모델에 프롬프트를 보내고, 그 응답을 스트리밍 형태로 보여줍니다. 텍스트와 슬롯 값을 조합하여 동적인 프롬프트를 만들 수 있습니다.</p>
 <p><strong>예시:</strong></p>
 <ol>
  <li><strong>슬롯 채우기</strong> 노드를 생성하고, 질문 내용에 "어떤 주제가 궁금하신가요?"를, 슬롯 이름에 <code>topic</code>을 입력합니다.</li>
  <li>이 노드를 <strong>LLM</strong> 노드와 연결합니다.</li>
  <li>LLM 노드의 컨트롤러에서 프롬프트를 다음과 같이 설정합니다: <code>{'{topic}'}에 대한 짧고 재미있는 이야기를 들려줘.</code></li>
  <li>시뮬레이터에서 테스트하면, 주제에 입력한 값이 프롬프트에 포함되어 언어 모델로 전송됩니다.</li>
 </ol>

 <h3>5.5. 노드 연결</h3>
 <ul>
 <li>노드의 좌우 가장자리에 있는 연결점을 클릭하여 다른 노드의 연결점으로 드래그하면 대화 흐름을 연결할 수 있습니다.</li>
 <li><strong>조건 분기/고정 메뉴/API 노드</strong>: 각 버튼(Branch/Menu)이나 결과(Success/Error)마다 별도의 연결점을 가집니다.</li>
 </ul>

 <h3>5.6. 노드 및 연결선 삭제/복제</h3>
 <ul>
 <li><strong>노드 삭제</strong>: 노드 우측 상단의 <code>x</code> 버튼을 클릭합니다.</li>
 <li><strong>연결선 삭제</strong>: 캔버스에서 삭제하고 싶은 연결선만 클릭하여 선택한 후, 키보드의 <code>Backspace</code> 또는 <code>Delete</code> 키를 누릅니다.</li>
 <li><strong>노드 복제</strong>: 복제하고 싶은 노드를 선택했을 때 좌측 '노드 추가' 패널 하단에 나타나는 <code>+ Duplicate Node</code> 버튼을 클릭합니다.</li>
 </ul>

 <h3>5.7. 저장 및 테스트</h3>
 <ul>
 <li><strong>저장</strong>: 화면 우측 상단의 <code>Save Scenario</code> 버튼을 클릭하여 현재 작업 중인 시나리오를 서버에 저장합니다.</li>
 <li><strong>테스트</strong>: <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> 아이콘을 클릭하여 시뮬레이터를 열고, 시나리오가 의도한 대로 작동하는지 테스트합니다.</li>
 </ul>
</>
);

function HelpModal({ isOpen, onClose }) {
if (!isOpen) return null;

const [language, setLanguage] = useState('en');

return (
 <div className={styles.modalOverlay} onClick={onClose}>
 <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
  <button className={styles.closeButton} onClick={onClose}>&times;</button>
  
  <select 
  className={styles.languageSelector} 
  value={language} 
  onChange={(e) => setLanguage(e.target.value)}
  >
  <option value="en">English</option>
  <option value="ko">한국어</option>
  </select>
  
  <h1>Chatbot Scenario Editor User Manual</h1>
  
  {language === 'en' ? <HelpManual /> : <HelpManual_ko />}
 </div>
 </div>
);
}

export default HelpModal;