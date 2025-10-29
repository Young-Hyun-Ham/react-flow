import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, signInWithPopup, provider } from './firebase';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board';
import Login from './Login';
import HelpModal from './HelpModal';
import ScenarioModal from './ScenarioModal';
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
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [backend, setBackend] = useState('firebase');

  const fetchNodeColors = useStore((state) => state.fetchNodeColors);
  const fetchNodeTextColors = useStore((state) => state.fetchNodeTextColors);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // ... (기존 인증 로직) ...
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

  const handleOpenAddScenarioModal = () => {
    setEditingScenario(null);
    setIsScenarioModalOpen(true);
  };

  const handleOpenEditScenarioModal = (scenario) => {
    setEditingScenario(scenario);
    setIsScenarioModalOpen(true);
  };

  // <<< [수정] description 파라미터 추가 ---
  const handleSaveScenario = async ({ name, job, description }) => {
  // --- [수정 끝] >>>
    try {
      if (editingScenario) {
        if (name !== editingScenario.name && scenarios.some(s => s.name === name)) {
          alert("A scenario with that name already exists.");
          return;
        }
        // <<< [수정] description 전달 ---
        await backendService.renameScenario(backend, { oldScenario: editingScenario, newName: name, job, description });
        setScenarios(prev => prev.map(s => (s.id === editingScenario.id ? { ...s, name, job, description } : s))); // <<< [수정] 상태 업데이트 시 description 추가
        // --- [수정 끝] >>>
        alert('Scenario updated successfully.');
      } else {
        if (scenarios.some(s => s.name === name)) {
          alert("A scenario with that name already exists.");
          return;
        }
        // <<< [수정] description 전달 ---
        const newScenario = await backendService.createScenario(backend, { newScenarioName: name, job, description });
         // --- [수정 끝] >>>
        setScenarios(prev => [...prev, newScenario]); // 백엔드 응답에 description이 포함되어 있다고 가정
        setSelectedScenario(newScenario);
        setView('flow');
        alert(`Scenario '${newScenario.name}' has been created.`);
      }
      setIsScenarioModalOpen(false);
      setEditingScenario(null);
    } catch (error) {
      console.error("Error saving scenario: ", error);
      alert(`Failed to save scenario: ${error.message}`);
    }
  };

  const handleViewChange = (targetView) => {
    if (targetView === 'flow') {
        if (selectedScenario) {
            setView('flow');
        } else {
            handleOpenAddScenarioModal();
        }
    } else {
        setView(targetView);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <AlertProvider>
      <div className="app-container">
        {/* ... (기존 헤더 및 네비게이션) ... */}
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
              disabled={!selectedScenario && view !== 'flow'}
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
          {/* ... (기존 뷰 컨테이너) ... */}
           <div className={`view-container ${view !== 'list' ? 'hidden' : ''}`}>
              <ScenarioList
                  backend={backend}
                  onSelect={handleScenarioSelect}
                  onAddScenario={handleOpenAddScenarioModal}
                  onEditScenario={handleOpenEditScenarioModal}
                  scenarios={scenarios}
                  setScenarios={setScenarios}
              />
          </div>

          <div className={`view-container ${view !== 'flow' ? 'hidden' : ''}`}>
            {selectedScenario && (
              <Flow scenario={selectedScenario} backend={backend} scenarios={scenarios} />
            )}
          </div>

          <div className={`view-container ${view !== 'board' ? 'hidden' : ''}`}>
              <Board user={user} />
          </div>

          <div className={`view-container ${view !== 'api' ? 'hidden' : ''}`}>
              <ApiDocs />
          </div>
        </main>
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        <ScenarioModal
          isOpen={isScenarioModalOpen}
          onClose={() => { setIsScenarioModalOpen(false); setEditingScenario(null); }}
          onSave={handleSaveScenario}
          scenario={editingScenario}
        />
      </div>
    </AlertProvider>
  );
}

export default App;