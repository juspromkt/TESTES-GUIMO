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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <LinkIcon className="w-8 h-8 text-gray-500" />
        <h1 className="text-2xl font-bold text-gray-800">Conexões</h1>
      </div>

        {/* Aba única de Conexão WhatsApp */}
        <div className="space-y-8">
          <div className="flex gap-1 border-b border-gray-200 mb-8">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors bg-gray-50 text-gray-700 font-medium border-b-2 border-gray-500"
            >
              <Smartphone className="w-4 h-4" />
              Conexão WhatsApp
            </button>
          </div>

          {/* Conteúdo da Conexão Principal */}
          <WhatsAppConnection canEditConnection={canEditConnection} />
        </div>
      </div>
    );
  };

export default Conexao;