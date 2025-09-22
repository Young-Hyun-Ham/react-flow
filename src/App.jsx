import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut } from './firebase';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board';
import Login from './Login';
import HelpModal from './HelpModal';
import NewScenarioModal from './NewScenarioModal';
import ApiDocs from './ApiDocs';
import useStore from './store';
import * as backendService from './backendService';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // 로그인 비활성화를 위해 기본값을 null로 설정
  const [loading, setLoading] = useState(false); // 로딩 상태 비활성화
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('list');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [backend, setBackend] = useState('firebase'); // 'firebase' or 'fastapi'

  const fetchNodeColors = useStore((state) => state.fetchNodeColors);
  const fetchNodeTextColors = useStore((state) => state.fetchNodeTextColors);

  useEffect(() => {
    // --- 💡 수정된 부분: 로그인 로직 비활성화 ---
    // onAuthStateChanged의 콜백을 주석 처리하여 자동 로그인을 막습니다.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // if (currentUser) {
      //   const allowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com'];
      //   const allowedDomains = ['cyberlogitec.com', 'wisenut.co.kr'];
        
      //   const userEmail = currentUser.email;
      //   const userDomain = userEmail.split('@')[1];

      //   const isAuthorized = allowedEmails.includes(userEmail) || allowedDomains.includes(userDomain);

      //   if (isAuthorized) {
      //     setUser(currentUser);
      //     fetchNodeColors();
      //     fetchNodeTextColors();
      //   } else {
      //     signOut(auth);
      //     alert("Access denied. You don't have permission to access this account.");
      //     setUser(null);
      //   }
      // } else {
      //   setUser(null);
      // }
      // setLoading(false);
    });

    // 초기 색상 설정은 그대로 유지
    fetchNodeColors();
    fetchNodeTextColors();

    return () => unsubscribe();
  }, [fetchNodeColors, fetchNodeTextColors]);

  const handleLogout = async () => {
    // 로그아웃 버튼을 눌렀을 때의 동작 (현재는 로그인 기능이 비활성화되어 있으므로 user 상태를 null로만 변경)
    setUser(null);
    // try {
    //   await signOut(auth);
    // } catch (error) {
    //   console.error("Error signing out: ", error);
    // }
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setView('flow');
  };
  
  const handleAddNewScenario = () => {
    setIsNewScenarioModalOpen(true);
  };

  const handleCreateScenario = async (newScenarioName) => {
    if (scenarios.some(s => s.name === newScenarioName)) {
      alert("A scenario with that name already exists. Please choose a different name.");
      return;
    }
    try {
      const newScenario = await backendService.createScenario(backend, { newScenarioName });
      alert(`Scenario '${newScenario.name}' has been created.`);
      setScenarios(prev => [...prev, newScenario]);
      setSelectedScenario(newScenario);
      setView('flow');
      setIsNewScenarioModalOpen(false);
    } catch (error) {
      console.error("Error creating new scenario: ", error);
      alert(`Failed to create scenario: ${error.message}`);
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
  
  // --- 💡 수정된 부분: 로그인 화면을 보여주는 대신 바로 앱을 렌더링 ---
  // if (!user) {
  //   return <Login />;
  // }

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
          <button onClick={() => handleViewChange('api')} className={view === 'api' ? 'active' : ''}>
            API Docs
          </button>
        </nav>
        <div className="user-profile">
          {/* Backend Switch */}
          <div className="backend-switch">
            <span>Firebase</span>
            <label className="switch">
              <input type="checkbox" checked={backend === 'fastapi'} onChange={() => setBackend(prev => prev === 'firebase' ? 'fastapi' : 'firebase')} />
              <span className="slider round"></span>
            </label>
            <span>FastAPI</span>
          </div>
          {/* --- 💡 수정된 부분: user가 없을 경우를 대비한 UI 처리 --- */}
          {user ? (
            <>
              <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
              <span>{user.displayName}</span>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </>
          ) : (
            <button onClick={() => alert("Please log in to use all features.")} className="logout-button">Login</button>
          )}
        </div>
      </header>
      <main className="app-main">
        <div className={`view-container ${view !== 'list' ? 'hidden' : ''}`}>
            <ScenarioList 
                backend={backend}
                onSelect={handleScenarioSelect} 
                onAddScenario={handleAddNewScenario}
                scenarios={scenarios}
                setScenarios={setScenarios}
            />
        </div>
        
        {selectedScenario && (
            <div className={`view-container ${view !== 'flow' ? 'hidden' : ''}`}>
                <Flow scenario={selectedScenario} backend={backend} />
            </div>
        )}
        
        <div className={`view-container ${view !== 'board' ? 'hidden' : ''}`}>
            <Board user={user} />
        </div>

        <div className={`view-container ${view !== 'api' ? 'hidden' : ''}`}>
            <ApiDocs />
        </div>
      </main>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <NewScenarioModal 
        isOpen={isNewScenarioModalOpen}
        onClose={() => setIsNewScenarioModalOpen(false)}
        onCreate={handleCreateScenario}
      />
    </div>
  );
}

export default App;