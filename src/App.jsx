import { useState } from 'react';
import Flow from './Flow';
import ScenarioList from './ScenarioList'; // 새로 만들 컴포넌트
import './App.css';

function App() {
  // 선택된 시나리오의 ID를 저장하는 상태
  const [selectedScenario, setSelectedScenario] = useState(null);

  // 시나리오를 선택했을 때 호출될 함수
  const handleScenarioSelect = (scenarioId) => {
    setSelectedScenario(scenarioId);
  };

  // 시나리오 목록으로 돌아가는 함수
  const handleBackToList = () => {
    setSelectedScenario(null);
  };

  return (
    <div className="App">
      {selectedScenario ? (
        // 선택된 시나리오가 있으면 Flow 컴포넌트를 렌더링
        <Flow scenarioId={selectedScenario} onBack={handleBackToList} />
      ) : (
        // 선택된 시나리오가 없으면 시나리오 목록을 보여줌
        <ScenarioList onSelect={handleScenarioSelect} />
      )}
    </div>
  );
}

export default App;