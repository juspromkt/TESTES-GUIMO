import { useState } from 'react';
import AgentsTab from '../components/ai-agent/AgentsTab';

/**
 * Página de exemplo demonstrando como usar o componente AgentsTab
 * Esta é uma página alternativa à AIAgent.tsx que utiliza o novo layout em grid
 */
const AIAgentGrid = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso não autorizado
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Faça login para acessar os agentes de IA
          </p>
        </div>
      </div>
    );
  }

  return (
    <AgentsTab
      token={token}
      onAgentSelect={(id) => {
        setSelectedAgentId(id);
        console.log('Agente selecionado:', id);
      }}
    />
  );
};

export default AIAgentGrid;
