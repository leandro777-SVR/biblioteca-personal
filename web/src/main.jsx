import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; //URL de la app y navegación SPA
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

// BrowserRouter habilita la navegación SPA; AuthProvider comparte la sesión con toda la app.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
