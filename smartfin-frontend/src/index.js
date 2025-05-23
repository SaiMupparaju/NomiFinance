import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AccountsProvider } from './contexts/AccountsContext';
import { FactProvider } from './contexts/FactContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom-bootstrap.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AccountsProvider> {/* Move AccountsProvider to wrap FactProvider */}
          <FactProvider>
            <App />
          </FactProvider>
        </AccountsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
