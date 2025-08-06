import { useState } from 'react';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board'; // Import Board component
import './App.css';

function App() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('flow'); // 'flow' or 'board'

  const handleScenarioSelect = (scenarioId) => {
    setSelectedScenario(scenarioId);
  };

  const handleBackToList = () => {
    setSelectedScenario(null);
  };

  // Renders the correct view for the 'flow' section
  const renderFlowView = () => {
    if (selectedScenario) {
      return <Flow scenarioId={selectedScenario} onBack={handleBackToList} />;
    }
    return <ScenarioList onSelect={handleScenarioSelect} />;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Chatbot Flow & Board</h1>
        <nav>
          <button 
            onClick={() => setView('flow')} 
            className={view === 'flow' ? 'active' : ''}
          >
            Flow Editor
          </button>
          <button 
            onClick={() => setView('board')}
            className={view === 'board' ? 'active' : ''}
          >
            Board
          </button>
        </nav>
      </header>
      <main className="app-main">
        {view === 'flow' ? renderFlowView() : <Board />}
      </main>
    </div>
  );
}

export default App;
