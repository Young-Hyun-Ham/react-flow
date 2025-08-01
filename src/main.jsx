import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Flow from './Flow.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className='main-container'>
      <Flow />
    </div>
  </StrictMode>,
)
