import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AssessmentProvider } from './context/AssessmentContext';
import PasswordGate from './components/PasswordGate';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PasswordGate>
      <HashRouter>
        <AssessmentProvider>
          <App />
        </AssessmentProvider>
      </HashRouter>
    </PasswordGate>
  </React.StrictMode>
);
