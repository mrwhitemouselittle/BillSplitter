import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { BillProvider } from './state/bill-state';
import './styles/app.css';

// Normalize legacy hash URLs before BrowserRouter reads the current location.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BillProvider>
        <App />
      </BillProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
