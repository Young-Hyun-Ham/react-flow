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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // --- 💡 수정된 부분: 이메일 및 도메인 기반 접근 제어 ---
        const allowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com'];
        const allowedDomains = ['cyberlogitec.com', 'wisenut.co.kr'];
        
        const userEmail = currentUser.email;
        const userDomain = userEmail.split('@')[1];

        const isAuthorized = allowedEmails.includes(userEmail) || allowedDomains.includes(userDomain);

        if (isAuthorized) {
          setUser(currentUser);
        } else {
          signOut(auth); // 권한 없는 사용자 강제 로그아웃
          alert("접근 권한이 없는 계정입니다.");
          setUser(null);
        }
        // --- 💡 수정된 부분 끝 ---
      } else {
        setUser(null);
      }
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

  // --- 💡 수정된 부분: Board 접근 제어 로직 제거 ---
  const handleViewChange = (targetView) => {
    setView(targetView);
  };
  // --- 💡 수정된 부분 끝 ---

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
          <button onClick={() => handleViewChange('flow')} className={view === 'flow' ? 'active' : ''}>
            Flow Editor
          </button>
          <button onClick={() => handleViewChange('board')} className={view === 'board' ? 'active' : ''}>
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
