import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { router } from './router';
import { runDevelopmentDataValidation } from './utils/dataValidation';
import './styles.css';

runDevelopmentDataValidation();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AuthProvider>
  </React.StrictMode>,
);
