import styles from './HelpModal.module.css';

// 설명서 내용을 JSX로 변환한 컴포넌트
const HelpManual = () => (
  <>
    <h2>1. 시작하기</h2>
    <h3>1.1. 로그인</h3>
    <ul>
      <li>구글 계정으로 로그인해야 서비스를 이용할 수 있습니다.</li>
      <li><strong>허용된 이메일과 도메인</strong>(<code>cyberlogitec.com</code>, <code>wisenut.co.kr</code>)을 가진 사용자만 접근이 가능합니다.</li>
    </ul>
    <h3>1.2. 메인 화면</h3>
    <ul>
      <li><strong>Flow Editor</strong>: 챗봇의 대화 흐름을 시각적으로 만들고 편집하는 기본 작업 공간입니다.</li>
      <li><strong>Board</strong>: 간단한 게시판 기능을 제공하여 사용자 간의 소통을 돕습니다.</li>
    </ul>

    <h2>2. 시나리오 관리</h2>
    <p>로그인 후 가장 먼저 보게 되는 화면은 <strong>시나리오 목록</strong>입니다.</p>
    <ul>
      <li><strong>새 시나리오 추가</strong>: <code>+ 새 시나리오 추가</code> 버튼을 클릭하고 시나리오 이름을 입력하여 새로운 대화 흐름을 생성합니다.</li>
      <li><strong>시나리오 선택</strong>: 목록에서 시나리오 이름을 클릭하면 해당 시나리오의 편집 화면으로 이동합니다.</li>
      <li><strong>시나리오 수정/삭제</strong>: 각 시나리오 항목 옆의 <code>수정</code> 버튼으로 이름을 변경하거나 <code>삭제</code> 버튼으로 시나리오를 영구적으로 제거할 수 있습니다.</li>
    </ul>

    <h2>3. Flow Editor 화면 구성</h2>
    <ol>
      <li><strong>노드 추가 패널 (좌측)</strong>: 시나리오를 구성하는 다양한 종류의 노드를 캔버스로 추가할 수 있습니다.</li>
      <li><strong>캔버스 (중앙)</strong>: 노드를 배치하고 연결하여 실제 대화 흐름을 만드는 공간입니다.</li>
      <li><strong>컨트롤러 패널 (우측)</strong>: 캔버스에서 노드를 선택하면 활성화되며, 해당 노드의 세부 내용을 편집할 수 있습니다.</li>
      <li><strong>시뮬레이터 (우측)</strong>: <code>🤖</code> 아이콘을 클릭하여 활성화할 수 있으며, 작성한 시나리오가 실제 챗봇에서 어떻게 동작하는지 실시간으로 테스트할 수 있습니다.</li>
    </ol>

    <h2>4. 노드(Node) 종류 및 기능</h2>
    <p>왼쪽 패널에서 원하는 노드를 클릭하여 캔버스에 추가할 수 있습니다.</p>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>노드 종류</th>
          <th>아이콘 색상</th>
          <th>설명</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Message</strong></td>
          <td>주황색</td>
          <td>챗봇이 사용자에게 보내는 가장 기본적인 텍스트 메시지입니다. 빠른 답장 버튼(Quick Replies)을 추가할 수 있습니다.</td>
        </tr>
        <tr>
          <td><strong>Form</strong></td>
          <td>보라색</td>
          <td>사용자로부터 정형화된 데이터를 입력받기 위한 양식입니다. (예: 이름, 날짜, 체크박스 등)</td>
        </tr>
        <tr>
          <td><strong>조건분기</strong></td>
          <td>초록색</td>
          <td>사용자의 답변에 따라 대화의 흐름을 여러 갈래로 나눕니다.</td>
        </tr>
        <tr>
          <td><strong>API</strong></td>
          <td>파란색</td>
          <td>사용자의 입력을 받아 특정 변수(Slot)에 저장하거나, 외부 시스템과 연동이 필요할 때 사용됩니다.</td>
        </tr>
        <tr>
          <td><strong>고정메뉴</strong></td>
          <td>빨간색</td>
          <td>챗봇 대화창 하단에 항상 노출되는 메뉴를 구성합니다. 시나리오의 시작점이 될 수 있습니다.</td>
        </tr>
        <tr>
          <td><strong>링크</strong></td>
          <td>남색</td>
          <td>사용자에게 외부 웹사이트 링크를 전달합니다.</td>
        </tr>
      </tbody>
    </table>

    <h2>5. 시나리오 편집 및 테스트</h2>
    <h3>5.1. 노드 편집</h3>
    <ol>
      <li>캔버스에서 편집할 노드를 클릭합니다.</li>
      <li>오른쪽에 나타나는 <strong>컨트롤러 패널</strong>에서 노드의 텍스트, 버튼, 양식 요소 등을 수정합니다.</li>
      <li>수정이 완료되면 컨트롤러 패널 하단의 <code>Save Changes</code> 버튼을 눌러 변경 사항을 노드에 적용합니다.</li>
    </ol>

    <h3>5.2. 노드 연결</h3>
    <ul>
      <li>노드의 오른쪽 또는 왼쪽 가장자리에 있는 연결점(Handle)을 클릭하여 다른 노드의 연결점으로 드래그하면 대화 흐름이 연결됩니다.</li>
      <li><strong>조건분기/고정메뉴 노드</strong>: 각 버튼(Branch/Menu)마다 별도의 연결점을 가집니다.</li>
    </ul>

    <h3>5.3. 노드 및 연결선 삭제/복제</h3>
    <ul>
      <li><strong>노드 삭제</strong>: 노드 우측 상단의 <code>❌</code> 버튼을 클릭합니다.</li>
      <li><strong>연결선 삭제</strong>: 캔버스에서 삭제할 연결선만 클릭하여 선택한 후, 키보드의 <code>Backspace</code> 또는 <code>Delete</code> 키를 누릅니다.</li>
      <li><strong>노드 복제</strong>: 복제하고 싶은 노드를 선택하면 왼쪽 '노드 추가' 패널 하단에 나타나는 <code>+ Duplicate Node</code> 버튼을 클릭합니다.</li>
    </ul>

    <h3>5.4. 저장 및 테스트</h3>
    <ul>
      <li><strong>저장</strong>: 화면 우측 상단의 <code>Save Scenario</code> 버튼을 눌러 현재 작업 중인 시나리오를 서버에 저장합니다.</li>
      <li><strong>테스트</strong>: <code>🤖</code> 아이콘을 클릭하여 시뮬레이터를 열고, 시나리오가 의도대로 작동하는지 테스트합니다.</li>
    </ul>
  </>
);


function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h1>챗봇 시나리오 에디터 사용 설명서</h1>
        <HelpManual />
      </div>
    </div>
  );
}

export default HelpModal;
