import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* --- 💡 수정된 부분: App 컴포넌트를 렌더링합니다 --- */}
    <App />
  </StrictMode>,
)