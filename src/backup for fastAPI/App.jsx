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
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('list');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const fetchNodeColors = useStore((state) => state.fetchNodeColors);
  const fetchNodeTextColors = useStore((state) => state.fetchNodeTextColors);

  const API_BASE_URL = '/api/proxy/chat/scenarios';
  const TENANT_ID = '1000';
  const STAGE_ID = 'DEV';


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
          fetchNodeColors();
          fetchNodeTextColors();
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
  }, [fetchNodeColors, fetchNodeTextColors]);

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
  
  const handleAddNewScenario = () => {
    setIsNewScenarioModalOpen(true);
  };

  // --- 💡 수정된 부분 시작 ---
  const handleCreateScenario = async (newScenarioName) => {
    if (scenarios.some(s => s.name === newScenarioName)) {
      alert("A scenario with that name already exists. Please choose a different name.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id : '111',
          name: newScenarioName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // FastAPI의 상세한 유효성 검사 오류 메시지를 표시하도록 수정
        const errorMessage = errorData.detail ? JSON.stringify(errorData.detail) : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const newScenario = await response.json();

      alert(`Scenario '${newScenario.name}' has been created.`);
      setScenarios(prev => [...prev, newScenario]);
      setSelectedScenario(newScenario.id);
      setView('flow');
      setIsNewScenarioModalOpen(false);
    } catch (error) {
      console.error("Error creating new scenario: ", error);
      alert(`Failed to create scenario: ${error.message}`);
    }
  };
  // --- 💡 수정된 부분 끝 ---


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
          <button onClick={() => handleViewChange('api')} className={view === 'api' ? 'active' : ''}>
            API Docs
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