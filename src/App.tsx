import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Prospectar from './pages/Prospectar';
import ProspeccaoDetalhes from './pages/ProspeccaoDetalhes';
import DirectDispatchDetails from './pages/DirectDispatchDetails';
import Configuracoes from './pages/Configuracoes';
import AIAgent from './pages/AIAgent';
import Contatos from './pages/Contatos';
import CRMLayoutPage from './pages/CRMLayoutPage'; // ✅ usa o layout com abas
import CRM from './pages/CRM';
import Conexao from './pages/Conexao';
import Appointments from './pages/Appointments';
import ChatProprio from './pages/ChatProprio';
import ParceirosSidebar from './components/sidebar/ParceirosSidebar';
import TutorialInterno from './pages/TutorialInterno';
import Suporte from './pages/Suporte';
import MenuMobile from './pages/MenuMobile';
import ContatosMobile from './pages/ContatosMobile';
import InicioMobile from './pages/InicioMobile';
import LoginMobile from './pages/LoginMobile';
import ConversasMobile from './pages/ConversasMobile';
import { fetchUserPermissions } from './utils/permissions';
import { MessageEventsProvider } from './pages/MessageEventsContext';
import { NotificationManager } from './components/NotificationManager';
import { ChatProvider } from './context/ChatContext';
import { ConversationProvider } from './context/ConversationContext';
import { VideoPlayerProvider } from './context/VideoPlayerContext';
import UpgradeModal from './components/UpgradeModal';
import { isDemoAccount } from './components/DemoBanner';

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

// Componente para redirecionar URLs antigas /crm/:id para /crm/deal/:id
const RedirectOldDealUrl = () => {
  const params = useParams();
  const id = params.id;
  return <Navigate to={`/crm/deal/${id}`} replace />;
};

function App() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Escuta evento de login bem-sucedido
  useEffect(() => {
    const handleLoginSuccess = () => {
      // Se for conta demo, inicia timer para mostrar modal de upgrade
      if (isDemoAccount()) {
        // Timer de 5 minutos
        const upgradeTimer = setTimeout(() => {
          setShowUpgradeModal(true);
        }, 300000); // 5 minutos (300000ms)

        // Salva o timer no localStorage para continuar após reload
        const startTime = Date.now();
        localStorage.setItem('upgradeModalTimer', startTime.toString());

        return () => clearTimeout(upgradeTimer);
      }
    };

    // Escuta o evento customizado de login
    window.addEventListener('userLoggedIn', handleLoginSuccess);

    return () => {
      window.removeEventListener('userLoggedIn', handleLoginSuccess);
    };
  }, []);

  // Gerencia timer de upgrade modal para contas demo (persiste após reloads)
  useEffect(() => {
    if (!isDemoAccount()) return;

    const checkUpgradeTimer = () => {
      const lastShownStr = localStorage.getItem('lastUpgradeModalShown');
      const now = Date.now();

      if (!lastShownStr) {
        // Primeira vez - agenda para daqui 5 minutos
        const timer = setTimeout(() => {
          setShowUpgradeModal(true);
          localStorage.setItem('lastUpgradeModalShown', now.toString());
        }, 300000); // 5 minutos (300000ms)

        return () => clearTimeout(timer);
      } else {
        // Verifica se já passou 5 minutos desde a última exibição
        const lastShown = parseInt(lastShownStr);
        const elapsed = now - lastShown;
        const interval = 300000; // 5 minutos (300000ms)

        if (elapsed >= interval) {
          // Já passou o intervalo, mostra imediatamente
          setShowUpgradeModal(true);
          localStorage.setItem('lastUpgradeModalShown', now.toString());
        } else {
          // Agenda para o tempo restante
          const remaining = interval - elapsed;
          const timer = setTimeout(() => {
            setShowUpgradeModal(true);
            localStorage.setItem('lastUpgradeModalShown', Date.now().toString());
          }, remaining);

          return () => clearTimeout(timer);
        }
      }
    };

    checkUpgradeTimer();
  }, []);

  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
    // Atualiza timestamp para contar 5 minutos a partir de agora
    localStorage.setItem('lastUpgradeModalShown', Date.now().toString());

    // Agenda o próximo modal
    if (isDemoAccount()) {
      setTimeout(() => {
        setShowUpgradeModal(true);
        localStorage.setItem('lastUpgradeModalShown', Date.now().toString());
      }, 300000); // 5 minutos (300000ms)
    }
  };

  return (
    <BrowserRouter>
      <UpgradeModal isOpen={showUpgradeModal} onClose={handleCloseUpgradeModal} />
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Login Mobile */}
        <Route path="/app/login" element={<LoginMobile />} />

        {/* Rotas do App Mobile - sem layout principal */}
        <Route
          path="/app/menu"
          element={
            <PrivateRoute>
              <MenuMobile />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/contatos"
          element={
            <PrivateRoute>
              <ContatosMobile />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/inicio"
          element={
            <PrivateRoute>
              <InicioMobile />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/conversas"
          element={
            <PrivateRoute>
              <ChatProvider>
                <ConversationProvider>
                  <MessageEventsProvider>
                    <ConversasMobile />
                  </MessageEventsProvider>
                </ConversationProvider>
              </ChatProvider>
            </PrivateRoute>
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <VideoPlayerProvider>
                <ChatProvider>
                  <ConversationProvider>
                    <MessageEventsProvider>
                      <MainLayout />
                      <NotificationManager />
                    </MessageEventsProvider>
                  </ConversationProvider>
                </ChatProvider>
              </VideoPlayerProvider>
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="conexao" element={<Conexao />} />
          <Route path="prospectar" element={<Prospectar />} />
          <Route path="prospectar/:id" element={<ProspeccaoDetalhes />} />
          <Route path="prospectar/dd/:id" element={<DirectDispatchDetails />} />
          <Route path="ai-agent" element={<AIAgent />} />
          {/* 👇 Rotas aninhadas do CRM com URLs separadas */}
          <Route path="crm" element={<CRMLayoutPage />}>
            <Route index element={<Navigate to="kanban" replace />} />
            <Route path="kanban" element={<CRM />} />
            <Route path="contatos" element={<Contatos />} />
            {/* Rota para detalhes de deal - exibe como painel lateral por cima */}
            <Route path="deal/:id" element={<CRM />} />
          </Route>
          {/* Redirecionamento de URLs antigas /crm/:id para /crm/deal/:id */}
          <Route path="crm/:id" element={<RedirectOldDealUrl />} />
          
          <Route path="agendamentos" element={<Appointments />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="conversas" element={<ChatProprio />} />
          <Route path="parceiros" element={<ParceirosSidebar />} />
          {/* Rotas do Tutorial com URLs específicas para cada aba */}
          <Route path="tutorial-interno">
            <Route index element={<Navigate to="videos" replace />} />
            <Route path="videos" element={<TutorialInterno />} />
            <Route path="artigos" element={<TutorialInterno />} />
            <Route path="guimoo-academy" element={<TutorialInterno />} />
          </Route>
          <Route path="suporte" element={<Suporte />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
