import { useState, useEffect } from 'react';
import FollowUpTab from '../components/ai-agent/FollowUpTab';
import { hasPermission } from '../utils/permissions';

/**
 * Página de Follow-up automático
 * Permite configurar mensagens automáticas de follow-up com base em tempo de inatividade
 */
const FollowUp = () => {
  const [canViewAgent, setCanViewAgent] = useState(false);
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    const checkPermissions = async () => {
      const hasAgentPermission = await hasPermission('can_view_menu_agent');
      setCanViewAgent(hasAgentPermission);
    };
    checkPermissions();
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso não autorizado
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Faça login para acessar o Follow-up
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FollowUpTab token={token} canViewAgent={canViewAgent} />
    </div>
  );
};

export default FollowUp;
