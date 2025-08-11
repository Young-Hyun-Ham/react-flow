import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board';
import Login from './Login';
import HelpModal from './HelpModal';
import NewScenarioModal from './NewScenarioModal'; // --- 💡 추가된 부분 ---
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('list');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  // --- 💡 추가된 부분: 새 시나리오 모달 상태 ---
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const allowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com'];
        const allowedDomains = ['cyberlogitec.com', 'wisenut.co.kr'];
        
        const userEmail = currentUser.email;
        const userDomain = userEmail.split('@')[1];

        const isAuthorized = allowedEmails.includes(userEmail) || allowedDomains.includes(userDomain);

        if (isAuthorized) {
          setUser(currentUser);
        } else {
          signOut(auth);
          alert("Access denied. You don't have permission to access this account.");
          setUser(null);
        }
      } else {
        setUser(null);
      }
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
    setView('flow');
  };
  
  // --- 💡 수정된 부분: prompt 대신 모달을 열도록 변경 ---
  const handleAddNewScenario = () => {
    setIsNewScenarioModalOpen(true);
  };

  // --- 💡 추가된 부분: 모달에서 'Create' 버튼 클릭 시 실행될 함수 ---
  const handleCreateScenario = async (newScenarioName) => {
    if (scenarios.includes(newScenarioName)) {
      alert("A scenario with that name already exists. Please choose a different name.");
      return;
    }
    const newScenarioRef = doc(db, "scenarios", newScenarioName);
    try {
      await setDoc(newScenarioRef, { nodes: [], edges: [] });
      alert(`Scenario '${newScenarioName}' has been created.`);
      setScenarios(prev => [...prev, newScenarioName]);
      setSelectedScenario(newScenarioName);
      setView('flow');
      setIsNewScenarioModalOpen(false); // 모달 닫기
    } catch (error) {
      console.error("Error creating new scenario: ", error);
      alert("Failed to create scenario.");
    }
  };

  const handleViewChange = (targetView) => {
    if (targetView === 'flow') {
        if (selectedScenario) {
            setView('flow');
        } else {
            handleAddNewScenario();
        }
    } else {
        setView(targetView);
    }
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
        <div className="header-title-container">
          <h1>Chatbot Flow & Board</h1>
          <button className="help-button" onClick={() => setIsHelpModalOpen(true)}>?</button>
        </div>
        <nav>
          <button onClick={() => handleViewChange('list')} className={view === 'list' ? 'active' : ''}>
            Scenario List
          </button>
          <button 
            onClick={() => handleViewChange('flow')} 
            className={view === 'flow' ? 'active' : ''}
          >
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
        <div className={`view-container ${view !== 'list' ? 'hidden' : ''}`}>
            <ScenarioList 
                onSelect={handleScenarioSelect} 
                onAddScenario={handleAddNewScenario}
                scenarios={scenarios}
                setScenarios={setScenarios}
            />
        </div>
        
        {selectedScenario && (
            <div className={`view-container ${view !== 'flow' ? 'hidden' : ''}`}>
                <Flow scenarioId={selectedScenario} />
            </div>
        )}
        
        <div className={`view-container ${view !== 'board' ? 'hidden' : ''}`}>
            <Board user={user} />
        </div>
      </main>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      {/* --- 💡 추가된 부분: 모달 컴포넌트 렌더링 --- */}
      <NewScenarioModal 
        isOpen={isNewScenarioModalOpen}
        onClose={() => setIsNewScenarioModalOpen(false)}
        onCreate={handleCreateScenario}
      />
    </div>
  );
}

export default App;