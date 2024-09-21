import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { FactProvider } from './contexts/FactContext';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import default Bootstrap CSS first
import './styles/custom-bootstrap.css';  

// Get the div with id 'root' and create a root for it
const container = document.getElementById('root');
const root = createRoot(container); // Create a root.

// Use the root to render your component tree
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FactProvider>
          <App />
        </FactProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
