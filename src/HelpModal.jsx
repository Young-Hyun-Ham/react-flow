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
 <li><strong>API Docs</strong>: Displays the API specification for managing scenarios.</li>
 <li><strong>Backend Switch</strong>: Located in the top-right header, this switch allows you to toggle between <strong>Firebase</strong> and <strong>FastAPI</strong> backends for scenario data storage and management.</li>
 </ul>

 <h2>2. Scenario Management</h2>
 <p>The first screen you see after login is the <strong>Scenario List</strong>.</p>
 <ul>
 <li><strong>Add New Scenario</strong>: Click the <code>+ Add New Scenario</code> button and enter a scenario name to create a new conversation flow.</li>
 <li><strong>Select Scenario</strong>: Click on a scenario name in the list to navigate to that scenario's editing screen.</li>
 <li><strong>Edit/Delete Scenario</strong>: Use the <code>Edit</code> button next to each scenario item to change the name, or the <code>Delete</code> button to permanently remove the scenario.</li>
 </ul>

  <h2>3. Board Usage</h2>
  <ul>
    <li>You can write new posts, and attach images or files.</li>
    <li>You can edit or delete only the posts you have created.</li>
  </ul>

 <h2>4. Flow Editor Screen Layout</h2>
 <ol>
 <li><strong>Node Addition Panel (Left)</strong>: Add various types of nodes that make up the scenario to the canvas.</li>
 <li><strong>Canvas (Center)</strong>: Space for placing nodes and connecting them to create actual conversation flows. A <strong>Minimap</strong> is available in the bottom-right corner for easy navigation.</li>
 <li><strong>Controller Panel (Right)</strong>: Activated when you select a node on the canvas, allowing you to edit the detailed content of that node.</li>
 <li><strong>Simulator (Right)</strong>: Can be activated by clicking the <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> icon to test how your written scenario works in real-time as an actual chatbot.</li>
 </ol>

 <h2>5. Node Types and Functions</h2>
 <p>Click the desired node from the left panel to add it to the canvas.</p>
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
  <td>A form for receiving structured data input from users. (e.g., name, date, checkboxes, etc.). Dropbox options can be dynamically populated from a slot.</td>
  </tr>
  <tr>
  <td><strong>Condition Branch</strong></td>
  <td>Divides the conversation flow into multiple branches based on user responses or slot values (including boolean <code>true</code>/<code>false</code>).</td>
  </tr>
  <tr>
  <td><strong>SlotFilling</strong></td>
  <td>Used to receive user input and store it in specific variables (Slots).</td>
  </tr>
  <tr>
  <td><strong>API</strong></td>
  <td>Calls an external API. You can use slot values in the request and save parts of the JSON response back into slots. It also allows branching the flow based on API call success or failure and supports sending multiple API requests in parallel.</td>
  </tr>
  <tr>
  <td><strong>LLM</strong></td>
  <td>Connects to a large language model to generate text based on a dynamic prompt. The flow can be branched based on keywords in the generated response.</td>
  </tr>
  <tr>
  <td><strong>Set Slot</strong></td>
  <td>Directly sets or updates the value of one or more slots. This is useful for initializing variables, marking progress, or manually changing a slot's value without user input.</td>
  </tr>
  <tr>
  <td><strong>Link</strong></td>
  <td>Delivers external website links to users.</td>
  </tr>
   <tr>
  <td><strong>Toast</strong></td>
  <td>Displays a small, non-intrusive pop-up message (like a toast notification) to the user in the simulator. It does not interrupt the conversation flow.</td>
  </tr>
  <tr>
  <td><strong>iFrame</strong></td>
  <td>Embeds an external webpage directly within the chatbot interface using an iframe.</td>
  </tr>
 </tbody>
 </table>

 <h2>6. Scenario Editing and Testing</h2>
 <h3>6.1. Node Editing</h3>
 <ol>
 <li>Click on the node you want to edit on the canvas.</li>
 <li>Modify the node's text, buttons, form elements, etc. in the <strong>Controller Panel</strong> that appears on the right.</li>
 <li>When editing is complete, click the <code>Save Changes</code> button at the bottom of the controller panel to apply changes to the node.</li>
 </ol>

 <h3>6.2. Using Slots (Variables)</h3>
 <p>Slots are variables used to store and reuse information within a scenario. You can store user input from a <strong>SlotFilling</strong> node, data from an <strong>API</strong> node's response, or set them directly with the <strong>Set Slot</strong> node.</p>
 <p>To use a stored slot value in other nodes (like Message, API, or LLM), use brace notation: <code>{'{slotName}'}</code>.</p>
 <p><strong>Example:</strong> If you stored a user's name in a slot called <code>userName</code>, you can use it in a Message node like this: <code>Hello, {'{userName}'}! Welcome.</code> The Slot Display in the top-left corner of the simulator shows the current values of all slots in a readable format.</p>
 
 <h4>6.2.1. Dynamic Dropbox Options (Slot Binding)</h4>
 <p>In a <strong>Form</strong> node, you can dynamically populate the options of a <strong>Dropbox</strong> element from a slot that contains an array.</p>
 <ul>
    <li><strong>Data Format</strong>: The slot must contain an array. The array can be a simple array of strings (e.g., <code>["Apple", "Banana"]</code>) or an array of objects with <code>label</code> and <code>value</code> keys (e.g., <code>[{'{'}label: 'Choice A', value: 'a{'}'}, {'{'}label: 'Choice B', value: 'b{'}'}]</code>).</li>
    <li><strong>Setup</strong>:
        <ol>
            <li>Select the Dropbox element in the Form Node controller.</li>
            <li>In the 'Options Slot' input field, enter the name of the slot that holds the array (e.g., <code>fruit_list</code>).</li>
            <li>When the simulator runs, the Dropbox will be filled with options from that slot. The manually entered 'Options (Fallback)' will be used if the specified slot is empty or not an array.</li>
        </ol>
    </li>
 </ul>

 <h3>6.3. Using the API Node</h3>
 <p>The API node allows for dynamic interaction with external servers.</p>
 <ul>
 <li><strong>Individual API Test</strong>: Click the <strong>Play (▶)</strong> button on the top-right corner of the API node to test that specific API call immediately. It will use the current slot values for the request and show you the result in a pop-up modal.</li>
 <li><strong>Multi API Request</strong>: You can send multiple API requests in parallel within a single API node.
    <ul>
        <li>Toggle the 'Enable Multi API' checkbox in the controller.</li>
        <li>Click '+ Add API Call' to add multiple requests. Each request can be configured with its own name, method, URL, and other settings.</li>
        <li>The node will proceed to the 'On Success' branch only after all API calls have completed successfully. If any one of them fails, it will proceed to the 'On Error' branch.</li>
    </ul>
 </li>
 <li><strong>Dynamic Requests</strong>: Use slots to make dynamic API calls. In the URL, Headers, or Body fields, you can insert values from previous user inputs or API responses using brace notation (e.g., <code>https://api.example.com/users/{'{userId}'}</code>).</li>
 <li><strong>Response Mapping</strong>: After a successful API call, you can extract values from the JSON response and save them into new or existing slots. In the "Response Mapping" section of the controller:
  <ul>
  <li><strong>JSON Path</strong>: Specify the path to the desired value in the JSON response. You can access nested objects with a dot (e.g., <code>data.user.name</code>) and array elements with brackets (e.g., <code>data.items[0].product</code>).</li>
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

 <h3>6.4. Using the LLM Node</h3>
 <p>The LLM node sends a prompt to a large language model and displays the response in a streaming format. You can create dynamic prompts by combining text with slot values.</p>
 <ul>
    <li><strong>Output Variable</strong>: You can store the entire generated text from the LLM into a slot. Specify the slot name in the 'Output Variable' field in the controller.</li>
    <li><strong>Conditional Branching</strong>: You can branch the conversation flow based on the content of the LLM's response.
        <ul>
            <li>In the controller, click '+ Add Condition' to add a new branch.</li>
            <li>Enter a specific 'Keyword' for each condition.</li>
            <li>If the keyword is found within the LLM's generated text, the conversation will proceed through the corresponding handle on the node.</li>
            <li>If none of the keywords are found, the conversation will proceed through the 'Default' handle.</li>
        </ul>
    </li>
 </ul>
 <p><strong>Example:</strong></p>
 <ol>
  <li>Create a <strong>SlotFilling</strong> node with the content "Which city would you like to know the weather for?" and set the slot name to <code>city</code>.</li>
  <li>Connect this node to an <strong>LLM</strong> node.</li>
  <li>In the LLM node's controller, set the prompt to: <code>Tell me about the weather in {'{city}'}. Mention if it is 'sunny', 'rainy', or 'cloudy'.</code> Set the 'Output Variable' to <code>weather_report</code>.</li>
  <li>Add two conditions: one with the keyword "sunny" and another with "rainy".</li>
  <li>Connect the "sunny" handle to a message node saying "Great! It's a sunny day.", the "rainy" handle to a node saying "Don't forget your umbrella!", and the "Default" handle to a node saying "Here is the weather forecast."</li>
 </ol>
 
 <h3>6.5. Node Connection</h3>
 <ul>
 <li>Click on the connection points (Handles) on the right or left edges of nodes and drag to other nodes' connection points to connect conversation flows.</li>
 <li><strong>Condition Branch/API/LLM nodes</strong>: Each button (Branch), outcome (Success/Error), or condition has its own separate connection point.</li>
 </ul>

 <h3>6.6. Node and Connection Deletion/Duplication</h3>
 <ul>
 <li><strong>Delete Node</strong>: Click the <code>x</code> button in the top right of the node.</li>
 <li><strong>Delete Connection</strong>: Click only the connection you want to delete on the canvas to select it, then press <code>Backspace</code> or <code>Delete</code> on your keyboard.</li>
 <li><strong>Duplicate Node</strong>: Click the <code>+ Duplicate Node</code> button that appears at the bottom of the left 'Add Node' panel when you select the node you want to duplicate.</li>
 </ul>

 <h3>6.7. Node and Scenario Group Management</h3>
  <p>You can reuse parts of scenarios or entire scenarios to build complex flows efficiently.</p>
  <ul>
    <li><strong>Export/Import Nodes</strong>:
      <ol>
        <li>Select one or more nodes (hold <code>Shift</code> to multi-select).</li>
        <li>Click <code>Export Nodes</code> to copy them to the clipboard.</li>
        <li>In another scenario, click <code>Import Nodes</code> to paste them.</li>
      </ol>
    </li>
    <li><strong>Scenario as Group</strong>:
      <ol>
        <li>Click the <code>+ Scenario Group</code> button in the left panel.</li>
        <li>Select a scenario from the modal to import it as a collapsible group.</li>
        <li>The group node automatically resizes to fit its content. You can connect nodes from outside the group to its input handle, and connect its output handle to other nodes to integrate it into your main flow.</li>
      </ol>
    </li>
  </ul>

 <h3>6.8. Save and Test</h3>
 <ul>
 <li><strong>Save</strong>: Click the <code><img src="/images/save.png" alt="save" style={{ width: '24px', height: '24px' }}/></code> icon in the top right of the screen to save the current scenario you're working on to the server.</li>
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
 <li><strong>API Docs</strong>: 시나리오 관리를 위한 API 명세를 보여줍니다.</li>
 <li><strong>백엔드 전환 스위치</strong>: 우측 상단 헤더에 위치하며, 시나리오 데이터 저장 및 관리를 위한 백엔드를 <strong>Firebase</strong>와 <strong>FastAPI</strong> 중에서 선택할 수 있습니다.</li>
 </ul>

 <h2>2. 시나리오 관리</h2>
 <p>로그인 후 가장 먼저 시나리오 목록 화면이 나타납니다.</p>
 <ul>
 <li><strong>새 시나리오 추가</strong>: <code>+ 새 시나리오 추가</code> 버튼을 클릭하고 시나리오 이름을 입력하여 새로운 대화 흐름을 생성합니다.</li>
 <li><strong>시나리오 선택</strong>: 목록에서 시나리오 이름을 클릭하면 해당 시나리오의 편집 화면으로 이동합니다.</li>
 <li><strong>시나리오 수정/삭제</strong>: 각 항목 옆의 <code>수정</code> 버튼으로 이름을 변경하거나, <code>삭제</code> 버튼으로 시나리오를 영구적으로 제거합니다.</li>
 </ul>

 <h2>3. 게시판 사용법</h2>
  <ul>
    <li>새 게시물을 작성하고, 이미지나 파일을 첨부할 수 있습니다.</li>
    <li>자신이 작성한 게시물만 수정하거나 삭제할 수 있습니다.</li>
  </ul>

 <h2>4. Flow Editor 화면 구성</h2>
 <ol>
 <li><strong>노드 추가 패널 (좌측)</strong>: 시나리오를 구성하는 다양한 종류의 노드를 캔버스에 추가합니다.</li>
 <li><strong>캔버스 (중앙)</strong>: 노드를 배치하고 연결하여 실제 대화 흐름을 구성하는 공간입니다. 쉬운 탐색을 위해 우측 하단에 <strong>미니맵</strong>이 제공됩니다.</li>
 <li><strong>컨트롤러 패널 (우측)</strong>: 캔버스에서 노드를 선택하면 활성화되며, 해당 노드의 세부 내용을 편집할 수 있습니다.</li>
 <li><strong>시뮬레이터 (우측)</strong>: <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> 아이콘을 클릭하여 활성화할 수 있으며, 작성한 시나리오가 실제 챗봇처럼 동작하는지 실시간으로 테스트할 수 있습니다.</li>
 </ol>

 <h2>5. 노드 종류 및 기능</h2>
 <p>좌측 패널에서 원하는 노드를 클릭하여 캔버스에 추가하세요.</p>
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
  <td>사용자로부터 정형화된 데이터 입력을 받기 위한 양식입니다. (예: 이름, 날짜, 체크박스 등). Dropbox의 선택지를 슬롯을 통해 동적으로 구성할 수 있습니다.</td>
  </tr>
  <tr>
  <td><strong>조건<br />분기</strong></td>
  <td>사용자의 답변 또는 슬롯 값(boolean 타입 <code>true</code>/<code>false</code> 포함)에 따라 대화 흐름을 여러 갈래로 나눕니다.</td>
  </tr>
  <tr>
  <td><strong>슬롯<br />채우기</strong></td>
  <td>사용자 입력을 받아 특정 변수(Slot)에 저장하는 데 사용됩니다.</td>
  </tr>
  <tr>
  <td><strong>API</strong></td>
  <td>외부 API를 호출합니다. 요청 시 슬롯 값을 사용할 수 있으며, JSON 응답의 일부를 다시 슬롯에 저장할 수 있습니다. API 호출 성공/실패 분기 및 다중 API 병렬 요청을 지원합니다.</td>
  </tr>
  <tr>
  <td><strong>LLM</strong></td>
  <td>거대 언어 모델과 연동하여 동적인 프롬프트를 기반으로 텍스트를 생성합니다. 생성된 응답 내용의 키워드에 따라 흐름을 분기할 수 있습니다.</td>
  </tr>
  <tr>
  <td><strong>슬롯<br/>설정</strong></td>
  <td>하나 이상의 슬롯 값을 직접 설정하거나 업데이트합니다. 변수 초기화, 진행 상태 기록, 사용자 입력 없이 값을 수동으로 변경할 때 유용합니다.</td>
  </tr>
  <tr>
  <td><strong>링크</strong></td>
  <td>외부 웹사이트 링크를 사용자에게 전달합니다.</td>
  </tr>
  <tr>
  <td><strong>토스트</strong></td>
  <td>시뮬레이터 내에서 사용자에게 방해되지 않는 작은 팝업 메시지(토스트 알림)를 표시합니다. 대화 흐름을 중단시키지 않습니다.</td>
  </tr>
   <tr>
  <td><strong>iFrame</strong></td>
  <td>iframe을 사용하여 외부 웹페이지를 챗봇 인터페이스 내에 직접 삽입합니다.</td>
  </tr>
 </tbody>
 </table>

 <h2>6. 시나리오 편집 및 테스트</h2>
 <h3>6.1. 노드 편집</h3>
 <ol>
 <li>캔버스에서 편집하고 싶은 노드를 클릭합니다.</li>
 <li>우측에 나타나는 <strong>컨트롤러 패널</strong>에서 노드의 텍스트, 버튼, 양식 요소 등을 수정합니다.</li>
 <li>편집이 끝나면 컨트롤러 패널 하단의 <code>Save Changes</code> 버튼을 클릭하여 변경 사항을 노드에 적용합니다.</li>
 </ol>

 <h3>6.2. 슬롯(변수) 사용하기</h3>
 <p>슬롯은 시나리오 내에서 정보를 저장하고 재사용하기 위한 변수입니다. <strong>슬롯 채우기</strong> 노드를 통해 받은 사용자 입력, <strong>API</strong> 노드의 응답 데이터, 또는 <strong>슬롯 설정</strong> 노드를 통해 직접 값을 할당할 수 있습니다.</p>
 <p>저장된 슬롯 값은 다른 노드(메시지, API, LLM 등)에서 중괄호 표기법(<code>{'{슬롯이름}'}</code>)을 사용하여 불러올 수 있습니다.</p>
 <p><strong>예시:</strong> <code>userName</code>이라는 슬롯에 사용자 이름을 저장했다면, 메시지 노드에서 <code>안녕하세요, {'{userName}'}님!</code> 과 같이 사용할 수 있습니다. 시뮬레이터 좌측 상단의 슬롯 표시 창은 현재 모든 슬롯의 값을 가독성 좋게 보여줍니다.</p>
 
 <h4>6.2.1. 동적 Dropbox 옵션 (슬롯 바인딩)</h4>
 <p><strong>Form</strong> 노드에서, 배열을 담고 있는 슬롯을 이용하여 <strong>Dropbox</strong> 요소의 선택지를 동적으로 채울 수 있습니다.</p>
 <ul>
    <li><strong>데이터 형식</strong>: 슬롯은 반드시 배열 형태여야 합니다. 단순 문자열 배열(예: <code>["사과", "바나나"]</code>)이거나, <code>label</code>과 <code>value</code> 키를 가진 객체 배열(예: <code>[{'{'}label: '선택 A', value: 'a{'}'}, {'{'}label: '선택 B', value: 'b{'}'}]</code>) 형식 모두 지원합니다.</li>
    <li><strong>설정 방법</strong>:
        <ol>
            <li>Form 노드 컨트롤러에서 Dropbox 요소를 선택합니다.</li>
            <li>'Options Slot' 입력 필드에 배열을 담고 있는 슬롯의 이름을 입력합니다(예: <code>fruit_list</code>).</li>
            <li>시뮬레이터가 실행될 때, 해당 슬롯의 값으로 Dropbox의 선택지가 채워집니다. 만약 지정된 슬롯이 비어있거나 배열이 아니면, 수동으로 입력된 'Options (Fallback)'이 대신 사용됩니다.</li>
        </ol>
    </li>
 </ul>

 <h3>6.3. API 노드 사용하기</h3>
 <p>API 노드를 사용하면 외부 서버와 동적으로 상호작용할 수 있습니다.</p>
 <ul>
 <li><strong>개별 API 테스트</strong>: API 노드 우측 상단의 <strong>재생(▶) 버튼</strong>을 클릭하면 해당 API를 즉시 테스트할 수 있습니다. 현재 슬롯 값을 사용하여 요청을 보내고, 결과를 팝업 모달로 보여줍니다.</li>
 <li><strong>다중 API 요청</strong>: 하나의 API 노드 내에서 여러 개의 API를 병렬로 요청할 수 있습니다.
    <ul>
        <li>컨트롤러에서 'Enable Multi API' 체크박스를 활성화합니다.</li>
        <li>'+ Add API Call' 버튼을 눌러 여러 요청을 추가합니다. 각 요청은 고유한 이름, 메서드, URL 등의 설정을 가집니다.</li>
        <li>노드는 모든 API 호출이 성공적으로 완료되었을 때만 'On Success' 브랜치로 진행합니다. 하나라도 실패하면 'On Error' 브랜치로 진행됩니다.</li>
    </ul>
 </li>
 <li><strong>동적 요청</strong>: 슬롯을 사용하여 동적인 API를 호출할 수 있습니다. URL, Headers, Body 필드에 중괄호 표기법(예: <code>https://api.example.com/users/{'{userId}'}</code>)을 사용하여 이전 사용자 입력이나 다른 API 응답 값을 삽입할 수 있습니다.</li>
 <li><strong>응답 매핑</strong>: API가 성공적으로 호출된 후, JSON 응답에서 특정 값을 추출하여 새 슬롯이나 기존 슬롯에 저장할 수 있습니다. 컨트롤러의 "Response Mapping" 섹션에서 다음을 설정하세요:
  <ul>
  <li><strong>JSON Path</strong>: JSON 응답에서 원하는 값의 경로를 지정합니다. 점(.)으로 하위 객체에 접근하고, 대괄호(`[]`)를 사용해 배열의 특정 요소에 접근할 수 있습니다 (예: <code>data.items[0].product</code>).</li>
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

 <h3>6.4. LLM 노드 사용하기</h3>
 <p>LLM 노드는 거대 언어 모델에 프롬프트를 보내고, 그 응답을 스트리밍 형태로 보여줍니다. 텍스트와 슬롯 값을 조합하여 동적인 프롬프트를 만들 수 있습니다.</p>
 <ul>
    <li><strong>출력 변수 (Output Variable)</strong>: LLM이 생성한 전체 텍스트를 슬롯에 저장할 수 있습니다. 컨트롤러의 'Output Variable' 필드에 슬롯 이름을 지정하세요.</li>
    <li><strong>조건부 분기 (Conditional Branching)</strong>: LLM 응답 내용에 따라 대화 흐름을 분기할 수 있습니다.
        <ul>
            <li>컨트롤러에서 '+ Add Condition' 버튼을 눌러 새 분기를 추가합니다.</li>
            <li>각 조건마다 특정 '키워드'를 입력합니다.</li>
            <li>LLM이 생성한 텍스트에 해당 키워드가 포함되어 있으면, 노드의 해당 핸들을 통해 대화가 진행됩니다.</li>
            <li>만약 설정된 키워드가 모두 발견되지 않으면, 'Default' 핸들을 통해 대화가 진행됩니다.</li>
        </ul>
    </li>
 </ul>
 <p><strong>예시:</strong></p>
 <ol>
  <li><strong>슬롯 채우기</strong> 노드를 생성하고, 질문 내용에 "어느 도시의 날씨가 궁금하신가요?"를, 슬롯 이름에 <code>city</code>를 입력합니다.</li>
  <li>이 노드를 <strong>LLM</strong> 노드와 연결합니다.</li>
  <li>LLM 노드 컨트롤러에서 프롬프트를 <code>{'{city}'}의 날씨를 알려주세요. '맑음', '비', '흐림' 중 하나로 언급해주세요.</code>로 설정하고, 'Output Variable'을 <code>weather_report</code>로 지정합니다.</li>
  <li>"맑음"과 "비"를 키워드로 하는 두 개의 조건을 추가합니다.</li>
  <li>"맑음" 핸들은 "좋아요! 화창한 날씨입니다." 라는 메시지 노드로, "비" 핸들은 "우산을 잊지 마세요!" 라는 노드로, "Default" 핸들은 "일기 예보를 알려드릴게요." 라는 노드로 각각 연결합니다.</li>
 </ol>

 <h3>6.5. 노드 연결</h3>
 <ul>
 <li>노드의 좌우 가장자리에 있는 연결점을 클릭하여 다른 노드의 연결점으로 드래그하면 대화 흐름을 연결할 수 있습니다.</li>
 <li><strong>조건 분기/API/LLM 노드</strong>: 각 버튼(Branch), 결과(Success/Error), 또는 조건마다 별도의 연결점을 가집니다.</li>
 </ul>

 <h3>6.6. 노드 및 연결선 삭제/복제</h3>
 <ul>
 <li><strong>노드 삭제</strong>: 노드 우측 상단의 <code>x</code> 버튼을 클릭합니다.</li>
 <li><strong>연결선 삭제</strong>: 캔버스에서 삭제하고 싶은 연결선만 클릭하여 선택한 후, 키보드의 <code>Backspace</code> 또는 <code>Delete</code> 키를 누릅니다.</li>
 <li><strong>노드 복제</strong>: 복제하고 싶은 노드를 선택했을 때 좌측 '노드 추가' 패널 하단에 나타나는 <code>+ Duplicate Node</code> 버튼을 클릭합니다.</li>
 </ul>
 
 <h3>6.7. 노드 및 시나리오 그룹 관리</h3>
 <p>시나리오의 일부 또는 전체를 재사용하여 복잡한 흐름을 효율적으로 구성할 수 있습니다.</p>
 <ul>
  <li><strong>노드 내보내기/가져오기</strong>:
   <ol>
    <li><code>Shift</code> 키를 누른 채 여러 노드를 선택한 후, <code>Export Nodes</code> 버튼으로 클립보드에 복사합니다.</li>
    <li>다른 시나리오에서 <code>Import Nodes</code> 버튼으로 붙여넣습니다.</li>
   </ol>
  </li>
  <li><strong>시나리오 그룹으로 가져오기</strong>:
   <ol>
    <li>왼쪽 패널에서 <code>+ Scenario Group</code> 버튼을 클릭합니다.</li>
    <li>모달 창에서 원하는 시나리오를 선택하면, 해당 시나리오의 전체 내용이 하나의 접을 수 있는 그룹 노드로 캔버스에 추가됩니다.</li>
    <li>그룹 노드는 내용에 맞게 크기가 자동으로 조절되며, 외부 노드와 연결하여 주 흐름에 통합할 수 있습니다.</li>
   </ol>
  </li>
 </ul>

 <h3>6.8. 저장 및 테스트</h3>
 <ul>
 <li><strong>저장</strong>: 화면 우측 상단의 <code><img src="/images/save.png" alt="save" style={{ width: '24px', height: '24px' }}/></code> 아이콘을 클릭하여 현재 작업 중인 시나리오를 서버에 저장합니다.</li>
 <li><strong>테스트</strong>: <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> 아이콘을 클릭하여 시뮬레이터를 열고, 시나리오가 의도한 대로 작동하는지 테스트합니다.</li>
 </ul>
</>
);

const HelpManual_vi = () => (
<>
 <h2>1. Bắt đầu</h2>
 <h3>1.1. Đăng nhập</h3>
 <ul>
 <li>Bạn phải đăng nhập bằng tài khoản Google để sử dụng dịch vụ.</li>
 <li>Chỉ những người dùng có <strong>email và tên miền được ủy quyền</strong> (<code>cyberlogitec.com</code>, <code>wisenut.co.kr</code>) mới có thể truy cập dịch vụ.</li>
 </ul>
 <h3>1.2. Màn hình chính</h3>
 <ul>
 <li><strong>Trình chỉnh sửa luồng (Flow Editor)</strong>: Không gian làm việc chính để tạo và chỉnh sửa luồng hội thoại của chatbot một cách trực quan.</li>
 <li><strong>Bảng tin (Board)</strong>: Cung cấp tính năng bảng tin đơn giản để giúp người dùng giao tiếp với nhau.</li>
 <li><strong>Tài liệu API (API Docs)</strong>: Hiển thị thông số kỹ thuật API để quản lý các kịch bản.</li>
 <li><strong>Công tắc Backend</strong>: Nằm ở tiêu đề trên cùng bên phải, công tắc này cho phép bạn chuyển đổi giữa các backend <strong>Firebase</strong> và <strong>FastAPI</strong> để lưu trữ và quản lý dữ liệu kịch bản.</li>
 </ul>

 <h2>2. Quản lý kịch bản</h2>
 <p>Màn hình đầu tiên bạn thấy sau khi đăng nhập là <strong>Danh sách kịch bản</strong>.</p>
 <ul>
 <li><strong>Thêm kịch bản mới</strong>: Nhấp vào nút <code>+ Thêm kịch bản mới</code> và nhập tên kịch bản để tạo một luồng hội thoại mới.</li>
 <li><strong>Chọn kịch bản</strong>: Nhấp vào tên kịch bản trong danh sách để điều hướng đến màn hình chỉnh sửa của kịch bản đó.</li>
 <li><strong>Chỉnh sửa/Xóa kịch bản</strong>: Sử dụng nút <code>Chỉnh sửa</code> bên cạnh mỗi mục kịch bản để thay đổi tên, hoặc nút <code>Xóa</code> để xóa vĩnh viễn kịch bản.</li>
 </ul>

  <h2>3. Cách sử dụng Bảng tin</h2>
  <ul>
    <li>Bạn có thể viết bài mới, đính kèm hình ảnh hoặc tệp tin.</li>
    <li>Bạn chỉ có thể chỉnh sửa hoặc xóa các bài đăng do chính bạn tạo.</li>
  </ul>

 <h2>4. Bố cục màn hình Trình chỉnh sửa luồng</h2>
 <ol>
 <li><strong>Bảng thêm Node (Bên trái)</strong>: Thêm các loại node khác nhau tạo nên kịch bản vào canvas.</li>
 <li><strong>Canvas (Ở giữa)</strong>: Không gian để đặt các node và kết nối chúng để tạo ra các luồng hội thoại thực tế. Một <strong>Bản đồ thu nhỏ (Minimap)</strong> có sẵn ở góc dưới cùng bên phải để dễ dàng điều hướng.</li>
 <li><strong>Bảng điều khiển (Bên phải)</strong>: Được kích hoạt khi bạn chọn một node trên canvas, cho phép bạn chỉnh sửa nội dung chi tiết của node đó.</li>
 <li><strong>Trình mô phỏng (Bên phải)</strong>: Có thể được kích hoạt bằng cách nhấp vào biểu tượng <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> để kiểm tra xem kịch bản bạn đã viết hoạt động như thế nào trong thời gian thực như một chatbot thực tế.</li>
 </ol>

 <h2>5. Các loại Node và chức năng</h2>
 <p>Nhấp vào node mong muốn từ bảng bên trái để thêm nó vào canvas.</p>
 <table className={styles.table}>
 <thead>
  <tr>
  <th>Loại Node</th>
  <th>Mô tả</th>
  </tr>
 </thead>
 <tbody>
  <tr>
  <td><strong>Tin nhắn</strong></td>
  <td>Tin nhắn văn bản cơ bản nhất mà chatbot gửi cho người dùng. Bạn có thể thêm các nút trả lời nhanh (Quick Replies).</td>
  </tr>
  <tr>
  <td><strong>Biểu mẫu</strong></td>
  <td>Một biểu mẫu để nhận dữ liệu có cấu trúc từ người dùng (ví dụ: tên, ngày tháng, hộp kiểm, v.v.). Các tùy chọn Dropbox có thể được điền động từ một slot.</td>
  </tr>
  <tr>
  <td><strong>Nhánh điều kiện</strong></td>
  <td>Chia luồng hội thoại thành nhiều nhánh dựa trên phản hồi của người dùng hoặc giá trị của slot (bao gồm cả giá trị boolean <code>true</code>/<code>false</code>).</td>
  </tr>
  <tr>
  <td><strong>Điền vào chỗ trống (SlotFilling)</strong></td>
  <td>Được sử dụng để nhận thông tin đầu vào của người dùng và lưu trữ nó trong các biến cụ thể (Slots).</td>
  </tr>
  <tr>
  <td><strong>API</strong></td>
  <td>Gọi một API bên ngoài. Bạn có thể sử dụng các giá trị của slot trong yêu cầu và lưu các phần của phản hồi JSON trở lại vào các slot. Nó cũng cho phép phân nhánh luồng dựa trên việc gọi API thành công hay thất bại và hỗ trợ gửi nhiều yêu cầu API song song.</td>
  </tr>
  <tr>
  <td><strong>LLM</strong></td>
  <td>Kết nối với một mô hình ngôn ngữ lớn để tạo văn bản dựa trên một lời nhắc động. Luồng có thể được phân nhánh dựa trên các từ khóa trong phản hồi được tạo ra.</td>
  </tr>
  <tr>
  <td><strong>Đặt Slot</strong></td>
  <td>Trực tiếp đặt hoặc cập nhật giá trị của một hoặc nhiều slot. Hữu ích để khởi tạo biến, đánh dấu tiến trình hoặc thay đổi giá trị của một slot theo cách thủ công mà không cần người dùng nhập.</td>
  </tr>
  <tr>
  <td><strong>Liên kết</strong></td>
  <td>Cung cấp các liên kết trang web bên ngoài cho người dùng.</td>
  </tr>
   <tr>
  <td><strong>Thông báo nhanh (Toast)</strong></td>
  <td>Hiển thị một thông báo bật lên nhỏ, không phô trương (giống như thông báo nhanh) cho người dùng trong trình mô phỏng. Nó không làm gián đoạn luồng hội thoại.</td>
  </tr>
  <tr>
  <td><strong>iFrame</strong></td>
  <td>Nhúng một trang web bên ngoài trực tiếp vào giao diện chatbot bằng iframe.</td>
  </tr>
 </tbody>
 </table>

 <h2>6. Chỉnh sửa và kiểm tra kịch bản</h2>
 <h3>6.1. Chỉnh sửa Node</h3>
 <ol>
 <li>Nhấp vào node bạn muốn chỉnh sửa trên canvas.</li>
 <li>Sửa đổi văn bản, nút, các yếu tố biểu mẫu, v.v. của node trong <strong>Bảng điều khiển</strong> xuất hiện ở bên phải.</li>
 <li>Khi chỉnh sửa xong, nhấp vào nút <code>Lưu thay đổi</code> ở cuối bảng điều khiển để áp dụng các thay đổi cho node.</li>
 </ol>

 <h3>6.2. Sử dụng Slots (Biến)</h3>
 <p>Slots là các biến được sử dụng để lưu trữ và tái sử dụng thông tin trong một kịch bản. Bạn có thể lưu trữ thông tin đầu vào của người dùng từ node <strong>Điền vào chỗ trống</strong>, dữ liệu từ phản hồi của node <strong>API</strong>, hoặc đặt chúng trực tiếp bằng node <strong>Đặt Slot</strong>.</p>
 <p>Để sử dụng giá trị của một slot đã lưu trong các node khác (như Tin nhắn, API hoặc LLM), hãy sử dụng ký hiệu dấu ngoặc nhọn: <code>{'{tên_slot}'}</code>.</p>
 <p><strong>Ví dụ:</strong> Nếu bạn đã lưu tên người dùng trong một slot có tên là <code>userName</code>, bạn có thể sử dụng nó trong một node Tin nhắn như sau: <code>Xin chào, {'{userName}'}! Chào mừng.</code> Màn hình hiển thị Slot ở góc trên cùng bên trái của trình mô phỏng hiển thị các giá trị hiện tại của tất cả các slot ở định dạng dễ đọc.</p>
 
 <h4>6.2.1. Tùy chọn Dropbox động (Liên kết Slot)</h4>
 <p>Trong một node <strong>Biểu mẫu</strong>, bạn có thể tự động điền các tùy chọn của một phần tử <strong>Dropbox</strong> từ một slot chứa một mảng.</p>
 <ul>
    <li><strong>Định dạng dữ liệu</strong>: Slot phải chứa một mảng. Mảng có thể là một mảng chuỗi đơn giản (ví dụ: <code>["Táo", "Chuối"]</code>) hoặc một mảng các đối tượng có khóa <code>label</code> và <code>value</code> (ví dụ: <code>[{"{"}label: 'Lựa chọn A', value: 'a{"}"}, {"{"}label: 'Lựa chọn B', value: 'b{"}"}]</code>).</li>
    <li><strong>Cài đặt</strong>:
        <ol>
            <li>Chọn phần tử Dropbox trong bộ điều khiển Node Biểu mẫu.</li>
            <li>Trong trường nhập 'Options Slot', nhập tên của slot chứa mảng (ví dụ: <code>fruit_list</code>).</li>
            <li>Khi trình mô phỏng chạy, Dropbox sẽ được điền với các tùy chọn từ slot đó. Các 'Tùy chọn (Dự phòng)' được nhập thủ công sẽ được sử dụng nếu slot được chỉ định trống hoặc không phải là một mảng.</li>
        </ol>
    </li>
 </ul>
 
 <h3>6.3. Sử dụng Node API</h3>
 <p>Node API cho phép tương tác động với các máy chủ bên ngoài.</p>
 <ul>
 <li><strong>Kiểm tra API riêng lẻ</strong>: Nhấp vào nút <strong>Phát (▶)</strong> ở góc trên cùng bên phải của node API để kiểm tra lệnh gọi API cụ thể đó ngay lập tức. Nó sẽ sử dụng các giá trị slot hiện tại cho yêu cầu và hiển thị cho bạn kết quả trong một cửa sổ bật lên.</li>
 <li><strong>Yêu cầu API đa nhiệm</strong>: Bạn có thể gửi nhiều yêu cầu API song song trong một node API duy nhất.
    <ul>
        <li>Chuyển đổi hộp kiểm 'Enable Multi API' trong bộ điều khiển.</li>
        <li>Nhấp vào '+ Add API Call' để thêm nhiều yêu cầu. Mỗi yêu cầu có thể được cấu hình với tên, phương thức, URL và các cài đặt khác.</li>
        <li>Node sẽ chỉ tiếp tục đến nhánh 'On Success' sau khi tất cả các lệnh gọi API đã hoàn thành thành công. Nếu bất kỳ một trong số chúng không thành công, nó sẽ tiếp tục đến nhánh 'On Error'.</li>
    </ul>
 </li>
 <li><strong>Yêu cầu động</strong>: Sử dụng các slot để thực hiện các lệnh gọi API động. Trong các trường URL, Headers hoặc Body, bạn có thể chèn các giá trị từ các thông tin đầu vào trước đó của người dùng hoặc các phản hồi API bằng cách sử dụng ký hiệu dấu ngoặc nhọn (ví dụ: <code>https://api.example.com/users/{'{userId}'}</code>).</li>
 <li><strong>Ánh xạ phản hồi</strong>: Sau khi gọi API thành công, bạn có thể trích xuất các giá trị từ phản hồi JSON và lưu chúng vào các slot mới hoặc hiện có. Trong phần "Ánh xạ phản hồi" của bộ điều khiển:
  <ul>
  <li><strong>Đường dẫn JSON</strong>: Chỉ định đường dẫn đến giá trị mong muốn trong phản hồi JSON (ví dụ: <code>data.user.name</code>).</li>
  <li><strong>Tên Slot</strong>: Nhập tên của slot nơi bạn muốn lưu trữ giá trị được trích xuất (ví dụ: <code>userName</code>).</li>
  </ul>
 </li>
 <li><strong>Phân nhánh thành công/thất bại</strong>: Node API có hai tay cầm nguồn ở phía bên phải của nó:
  <ul>
  <li><code>Khi thành công</code>: Kéo một kết nối từ tay cầm này đến node sẽ theo sau một lệnh gọi API thành công.</li>
  <li><code>Khi có lỗi</code>: Kéo một kết nối từ tay cầm này đến node sẽ theo sau một lệnh gọi API không thành công (ví dụ: lỗi mạng, lỗi máy chủ).</li>
  </ul>
 </li>
 </ul>

 <h3>6.4. Sử dụng Node LLM</h3>
 <p>Node LLM gửi một lời nhắc đến một mô hình ngôn ngữ lớn và hiển thị phản hồi ở định dạng phát trực tuyến. Bạn có thể tạo các lời nhắc động bằng cách kết hợp văn bản với các giá trị của slot.</p>
 <ul>
    <li><strong>Biến đầu ra</strong>: Bạn có thể lưu trữ toàn bộ văn bản được tạo từ LLM vào một slot. Chỉ định tên slot trong trường 'Biến đầu ra' trong bộ điều khiển.</li>
    <li><strong>Phân nhánh có điều kiện</strong>: Bạn có thể phân nhánh luồng hội thoại dựa trên nội dung phản hồi của LLM.
        <ul>
            <li>Trong bộ điều khiển, nhấp vào '+ Thêm điều kiện' để thêm một nhánh mới.</li>
            <li>Nhập một 'Từ khóa' cụ thể cho mỗi điều kiện.</li>
            <li>Nếu từ khóa được tìm thấy trong văn bản do LLM tạo ra, cuộc hội thoại sẽ tiếp tục thông qua tay cầm tương ứng trên node.</li>
            <li>Nếu không tìm thấy từ khóa nào, cuộc hội thoại sẽ tiếp tục thông qua tay cầm 'Mặc định'.</li>
        </ul>
    </li>
 </ul>
 <p><strong>Ví dụ:</strong></p>
 <ol>
  <li>Tạo một node <strong>Điền vào chỗ trống</strong> với nội dung "Bạn muốn biết thời tiết của thành phố nào?" và đặt tên slot là <code>city</code>.</li>
  <li>Kết nối node này với một node <strong>LLM</strong>.</li>
  <li>Trong bộ điều khiển của node LLM, đặt lời nhắc thành: <code>Hãy cho tôi biết về thời tiết ở {'{city}'}. Hãy đề cập xem trời có 'nắng', 'mưa' hay 'nhiều mây' không.</code> Đặt 'Biến đầu ra' thành <code>weather_report</code>.</li>
  <li>Thêm hai điều kiện: một với từ khóa "nắng" và một với từ khóa "mưa".</li>
  <li>Kết nối tay cầm "nắng" với một node tin nhắn có nội dung "Tuyệt vời! Hôm nay là một ngày nắng đẹp.", tay cầm "mưa" với một node có nội dung "Đừng quên mang theo ô của bạn!" và tay cầm "Mặc định" với một node có nội dung "Đây là dự báo thời tiết."</li>
 </ol>
 
 <h3>6.5. Kết nối Node</h3>
 <ul>
 <li>Nhấp vào các điểm kết nối (Handles) ở cạnh phải hoặc trái của các node và kéo đến các điểm kết nối của các node khác để kết nối các luồng hội thoại.</li>
 <li><strong>Node Nhánh điều kiện/API/LLM</strong>: Mỗi nút (Nhánh), kết quả (Thành công/Lỗi) hoặc điều kiện đều có điểm kết nối riêng.</li>
 </ul>

 <h3>6.6. Xóa/Nhân bản Node và Kết nối</h3>
 <ul>
 <li><strong>Xóa Node</strong>: Nhấp vào nút <code>x</code> ở trên cùng bên phải của node.</li>
 <li><strong>Xóa kết nối</strong>: Chỉ nhấp vào kết nối bạn muốn xóa trên canvas để chọn nó, sau đó nhấn <code>Backspace</code> hoặc <code>Delete</code> trên bàn phím của bạn.</li>
 <li><strong>Nhân bản Node</strong>: Nhấp vào nút <code>+ Nhân bản Node</code> xuất hiện ở cuối bảng 'Thêm Node' bên trái khi bạn chọn node bạn muốn nhân bản.</li>
 </ul>

 <h3>6.7. Quản lý Node và Nhóm kịch bản</h3>
 <p>Bạn có thể tái sử dụng các phần của kịch bản hoặc toàn bộ kịch bản để xây dựng các luồng phức tạp một cách hiệu quả.</p>
 <ul>
  <li><strong>Xuất/Nhập Node</strong>:
   <ol>
    <li>Chọn một hoặc nhiều node (giữ <code>Shift</code> để chọn nhiều).</li>
    <li>Nhấp vào <code>Xuất Node</code> để sao chép chúng vào khay nhớ tạm.</li>
    <li>Trong một kịch bản khác, nhấp vào <code>Nhập Node</code> để dán chúng.</li>
   </ol>
  </li>
  <li><strong>Kịch bản dưới dạng Nhóm</strong>:
   <ol>
    <li>Nhấp vào nút <code>+ Nhóm kịch bản</code> trong bảng điều khiển bên trái.</li>
    <li>Chọn một kịch bản từ cửa sổ bật lên để nhập nó dưới dạng một nhóm có thể thu gọn.</li>
    <li>Node nhóm tự động thay đổi kích thước để phù hợp với nội dung của nó. Bạn có thể kết nối các node từ bên ngoài nhóm với tay cầm đầu vào của nó và kết nối tay cầm đầu ra của nó với các node khác để tích hợp nó vào luồng chính của bạn.</li>
   </ol>
  </li>
 </ul>

 <h3>6.8. Lưu và Kiểm tra</h3>
 <ul>
 <li><strong>Lưu</strong>: Nhấp vào biểu tượng <code><img src="/images/save.png" alt="save" style={{ width: '24px', height: '24px' }}/></code> ở trên cùng bên phải màn hình để lưu kịch bản hiện tại bạn đang làm việc vào máy chủ.</li>
 <li><strong>Kiểm tra</strong>: Nhấp vào biểu tượng <code><img src="/images/chat_simulator.png" alt="chatbot" style={{ width: '24px', height: '24px' }}/></code> để mở trình mô phỏng và kiểm tra xem kịch bản có hoạt động như dự kiến không.</li>
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
  <option value="vi">Tiếng Việt</option>
  </select>
  
  <h1>Chatbot Scenario Editor User Manual</h1>
  
  {language === 'en' && <HelpManual />}
  {language === 'ko' && <HelpManual_ko />}
  {language === 'vi' && <HelpManual_vi />}
 </div>
 </div>
);
}

export default HelpModal;