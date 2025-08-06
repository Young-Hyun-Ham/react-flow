import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut } from './firebase';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board';
import Login from './Login'; // Import Login component
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('flow');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
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
