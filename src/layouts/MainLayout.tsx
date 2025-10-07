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

  // Detect if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verify session and refresh permissions
  useEffect(() => {
    const checkSession = () => {
      if (checkSessionExpiration()) {
        navigate('/');
        return;
      }
      
      // Refresh permissions on page reload/navigation
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

  // Listen for sidebar collapsed state changes
  useEffect(() => {
    const checkCollapsedState = () => {
      const sidebarContainer = document.getElementById('sidebar-container');
      if (sidebarContainer) {
        const isCollapsed = sidebarContainer.dataset.collapsed === 'true';
        setSidebarCollapsed(isCollapsed);
      }
    };

    // Check immediately
    checkCollapsedState();

    // Check on mouse events for hover detection
    const interval = setInterval(checkCollapsedState, 50);
    
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <>
      {isMobile ? (
        // MOBILE: tudo em coluna, Sidebar no topo e conteúdo abaixo
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
        // DESKTOP: sidebar à esquerda fixa e conteúdo ao lado
<div className="flex w-full">
  {/* Sidebar fixa */}
  <div className="sticky top-0 h-screen">
          <Sidebar />
                  </div>

          {/* Main Content Area */} 
          <div 
            className={`flex-1 min-h-screen transition-all duration-300 ${
              sidebarCollapsed ? 'ml-0' : 'ml-0'
            } ${isChatPage ? 'p-0' : 'mr-2'}`}
            style={{
              marginLeft: sidebarCollapsed ? '' : '',
            }}
          >
            <main className={`w-full min-h-screen ${
              isChatPage
                ? 'p-0'
                : 'p-4 md:p-6 lg:p-8'
            }`}>
              <DemoBanner />
              <div className="w-full max-w-none">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      )}
      
      {/* Custom Styles for smooth transitions */}
      <style jsx>{`
        /* Ensure smooth sidebar transitions */
        #sidebar-container {
          transition: width 0.3s ease-in-out;
        }
        
        /* Prevent horizontal overflow */
        body {
          overflow-x: hidden;
        }
        
        /* Responsive adjustments */
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