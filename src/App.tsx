import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Conexao from './pages/Conexao';
import Prospectar from './pages/Prospectar';
import ProspeccaoDetalhes from './pages/ProspeccaoDetalhes';
import DirectDispatchDetails from './pages/DirectDispatchDetails';
import Configuracoes from './pages/Configuracoes';
import AIAgent from './pages/AIAgent';
import Contatos from './pages/Contatos';
import CRM from './pages/CRM';
import DealDetails from './pages/DealDetails';
import Appointments from './pages/Appointments';
import ChatProprio from './pages/ChatProprio';
import { fetchUserPermissions } from './utils/permissions';
import { MessageEventsProvider } from './pages/MessageEventsContext';
import { NotificationManager } from './components/NotificationManager';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('user');
  
  useEffect(() => {
    const loadPermissions = async () => {
      if (isAuthenticated) {
        const user = JSON.parse(isAuthenticated);
        await fetchUserPermissions(user.token);
      }
    };
    
    loadPermissions();
  }, [isAuthenticated]);
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MessageEventsProvider>
                <MainLayout />
                <NotificationManager />
              </MessageEventsProvider>
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="conexao" element={<Conexao />} />
          <Route path="prospectar" element={<Prospectar />} />
          <Route path="prospectar/:id" element={<ProspeccaoDetalhes />} />
          <Route path="prospectar/dd/:id" element={<DirectDispatchDetails />} />
          <Route path="ai-agent" element={<AIAgent />} />
          <Route path="contatos" element={<Contatos />} />
          <Route path="crm" element={<CRM />} />
          <Route path="crm/:id" element={<DealDetails />} />
          <Route path="agendamentos" element={<Appointments />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="conversas" element={<ChatProprio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;