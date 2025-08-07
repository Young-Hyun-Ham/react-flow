import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // --- 💡 수정: StrictMode를 주석 처리하거나 삭제합니다 ---
  // <StrictMode>
    <App />
  // </StrictMode>,
)