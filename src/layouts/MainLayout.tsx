import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DemoBanner from '../components/DemoBanner';
import { checkSessionExpiration } from '../utils/auth';
import { fetchUserPermissions } from '../utils/permissions';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isChatPage = location.pathname === '/conversas';

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verifica sessão e permissões
  useEffect(() => {
    const checkSession = () => {
      if (checkSessionExpiration()) {
        navigate('/');
        return;
      }

      const user = localStorage.getItem('user');
      if (user) {
        const token = JSON.parse(user).token;
        fetchUserPermissions(token);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Monitora o estado de colapso da sidebar
  useEffect(() => {
    const checkCollapsedState = () => {
      const sidebarContainer = document.getElementById('sidebar-container');
      if (sidebarContainer) {
        const isCollapsed = sidebarContainer.dataset.collapsed === 'true';
        setSidebarCollapsed(isCollapsed);
      }
    };

    checkCollapsedState();
    const interval = setInterval(checkCollapsedState, 50);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <>
      {isMobile ? (
        // 📱 MOBILE: Sidebar no topo, conteúdo abaixo
        <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
          <div className="fixed top-0 left-0 right-0 z-50">
            <Sidebar />
          </div>
          <main className={`flex-1 pt-20 ${isChatPage ? 'px-0' : 'px-4'}`}>
            <DemoBanner />
            <Outlet />
          </main>
        </div>
      ) : (
        // 💻 DESKTOP: Sidebar fixa e sobreposta
        <div className="relative w-full min-h-screen">
          {/* Sidebar fixa sobreposta (não empurra conteúdo) */}
          <Sidebar />

          {/* Conteúdo principal ocupando toda a tela */}
          <main
  className={`w-full min-h-screen relative z-0 transition-all duration-300 ${
    isChatPage
      ? 'p-0 pl-16' // Chat precisa só de espaço fixo
      : 'p-4 md:p-6 lg:p-8 pl-20' // dá margem à esquerda
  }`}
  style={{
    paddingLeft: '4.5rem', // garante espaço quando a sidebar está sobreposta
  }}
>
            <DemoBanner />
            <div className="w-full max-w-none">
              <Outlet />
            </div>
          </main>
        </div>
      )}

      {/* 🎨 Estilos extras */}
      <style jsx>{`
        #sidebar-container {
          transition: width 0.3s ease-in-out;
        }

        body {
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none;
          }
        }

        @media (min-width: 769px) {
          .sidebar-mobile {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default MainLayout;
