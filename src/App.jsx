import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, signInWithPopup, provider } from './firebase';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board';
import Login from './Login';
import HelpModal from './HelpModal';
import NewScenarioModal from './NewScenarioModal';
import ApiDocs from './ApiDocs';
import useStore from './store';
import * as backendService from './backendService';
import { AlertProvider } from './context/AlertProvider';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('list');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [backend, setBackend] = useState('firebase');

  const fetchNodeColors = useStore((state) => state.fetchNodeColors);
  const fetchNodeTextColors = useStore((state) => state.fetchNodeTextColors);

  useEffect(() => {
    // onAuthStateChanged는 로그인/로그아웃 상태를 감지하고 user 상태를 업데이트하기 위해 유지합니다.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 이메일/도메인 검증 로직은 그대로 유지합니다.
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

    // 초기 색상 설정은 로그인 상태와 무관하게 실행합니다.
    fetchNodeColors();
    fetchNodeTextColors();

    return () => unsubscribe();
  }, [fetchNodeColors, fetchNodeTextColors]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
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
  
  // --- 💡 수정된 부분: 로그인 여부와 관계없이 앱을 항상 렌더링합니다. ---
  return (
    <AlertProvider>
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
            <div className="backend-switch">
              <span>Firebase</span>
              <label className="switch">
                <input type="checkbox" checked={backend === 'fastapi'} onChange={() => setBackend(prev => prev === 'firebase' ? 'fastapi' : 'firebase')} />
                <span className="slider round"></span>
              </label>
              <span>FastAPI</span>
            </div>
            {/* --- 💡 수정된 부분: 로그인 상태에 따라 UI를 다르게 표시 --- */}
            {user ? (
              <>
                <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                <span>{user.displayName}</span>
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </>
            ) : (
              <button onClick={handleLogin} className="logout-button">Login</button>
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
    </AlertProvider>
  );
}

export default App;