import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Settings } from 'lucide-react';

export default function EmptyFunnelState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-200 max-w-lg">
        <GitBranch className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Você ainda não configurou/ativou seu CRM
        </h2>
        <p className="text-gray-600 mb-6">
          Para começar a gerenciar seus leads, você precisa configurar os Status do Lead primeiro.
          Vá até Configurações → Status do Lead e configure agora.
        </p>
        <Link
          to="/configuracoes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
          Ir para Configurações
        </Link>
      </div>
    </div>
  );
}