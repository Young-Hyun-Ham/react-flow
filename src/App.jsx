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
    const allowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com', 'hmlee@cyberlogitec.com','hmlee@wisenut.co.kr','circlebell@wisenut.co.kr','jwjun@wisenut.co.kr'];

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // 주석 처리된 이전 로직은 그대로 둡니다.
      // if (currentUser && !allowedEmails.includes(currentUser.email)) {
      //   signOut(auth);
      //   alert("접근 권한이 없는 계정입니다.");
      //   setUser(null);
      // } else {
        setUser(currentUser);
      // }
      setLoading(false);
    });

    return () => unsubscribe();
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

  // --- 💡 추가된 부분 ---
  const handleViewChange = (targetView) => {
    if (targetView === 'board') {
      // Board 탭에 접근할 수 있는 이메일 목록
      const boardAllowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com', 'hmlee@cyberlogitec.com','hmlee@wisenut.co.kr','circlebell@wisenut.co.kr','jwjun@wisenut.co.kr'];
      if (user && boardAllowedEmails.includes(user.email)) {
        setView('board');
      } else {
        alert('이 게시판에 접근할 수 있는 권한이 없습니다.');
      }
    } else {
      setView(targetView);
    }
  };
  // --- 💡 추가된 부분 끝 ---

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
          {/* --- 💡 수정된 부분: onClick 핸들러 변경 --- */}
          <button onClick={() => handleViewChange('flow')} className={view === 'flow' ? 'active' : ''}>
            Flow Editor
          </button>
          <button onClick={() => handleViewChange('board')} className={view === 'board' ? 'active' : ''}>
            Board
          </button>
          {/* --- 💡 수정된 부분 끝 --- */}
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
