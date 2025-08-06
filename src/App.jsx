import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut } from './firebase';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board';
import Login from './Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('flow');

  useEffect(() => {
    // --- 💡 추가된 부분: 허용할 구글 이메일 목록 ---
    // const allowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com'];
    const allowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com', 'hmlee@cyberlogitec.com','hmlee@wisenut.co.kr','circlebell@wisenut.co.kr','jwjun@wisenut.co.kr'];

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // 사용자가 로그인했고, 허용된 이메일 목록에 없는 경우
      // if (currentUser && !allowedEmails.includes(currentUser.email)) {
      //   signOut(auth); // 강제로 로그아웃 처리
      //   alert("접근 권한이 없는 계정입니다.");
      //   setUser(null); // 사용자 상태를 null로 설정
      // } else {
        // 허용된 사용자이거나 로그아웃 상태인 경우
        setUser(currentUser);
      // }
      setLoading(false);
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleScenarioSelect = (scenarioId) => {
    setSelectedScenario(scenarioId);
  };

  const handleBackToList = () => {
    setSelectedScenario(null);
  };

  const renderFlowView = () => {
    if (selectedScenario) {
      return <Flow scenarioId={selectedScenario} onBack={handleBackToList} />;
    }
    return <ScenarioList onSelect={handleScenarioSelect} />;
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Chatbot Flow & Board</h1>
        <nav>
          <button onClick={() => setView('flow')} className={view === 'flow' ? 'active' : ''}>
            Flow Editor
          </button>
          <button onClick={() => setView('board')} className={view === 'board' ? 'active' : ''}>
            Board
          </button>
        </nav>
        <div className="user-profile">
          <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
          <span>{user.displayName}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>
      <main className="app-main">
        {view === 'flow' ? renderFlowView() : <Board user={user} />}
      </main>
    </div>
  );
}

export default App;
