import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Smartphone } from 'lucide-react';
import WhatsAppConnection from '../components/conexao/WhatsAppConnection';
import { hasPermission, fetchUserPermissions } from '../utils/permissions';

const Conexao = () => {
  const [canEditConnection, setCanEditConnection] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = user ? JSON.parse(user).token : null;

    const loadPermissions = async () => {
      if (token) {
        await fetchUserPermissions(token);
      }
      setCanEditConnection(hasPermission('can_edit_connection'));
    };

    loadPermissions();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header moderno */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Conexões</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Gerencie suas conexões do WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Conteúdo da Conexão Principal */}
      <WhatsAppConnection canEditConnection={canEditConnection} />
    </div>
  );
};

export default Conexao;