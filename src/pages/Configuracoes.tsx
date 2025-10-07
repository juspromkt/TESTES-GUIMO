import React, { useState, useEffect } from 'react';
import { Database, Sliders, Users, Webhook, Key, MessageSquare } from 'lucide-react';
import FontesSection from '../components/configuracoes/FontesSection';
import ParametrosSection from '../components/configuracoes/ParametrosSection';
import ModelosSection from '../components/configuracoes/ModelosSection';
import FunisSection from '../components/configuracoes/FunisSection';
import TagsSection from '../components/configuracoes/TagsSection';
import CamposSection from '../components/configuracoes/CamposSection';
import UsersSection from '../components/configuracoes/UsersSection';
import WebhooksSection from '../components/configuracoes/WebhooksSection';
import ApiKeySection from '../components/configuracoes/ApiKeySection';
import ConversasSection from '../components/configuracoes/ConversasSection';
import { hasPermission } from '../utils/permissions';

type MainSection = 'disparo' | 'crm' | 'conversas' | 'usuarios' | 'webhooks' | 'apikey' | null;
type DisparoSection = 'parametros' | 'modelos' | null;
type CrmSection = 'fontes' | 'funis' | 'tags' | 'campos' | null;
type ConversasSectionType = 'assinatura' | null;
type UsuariosSection = 'gerenciar' | null;
type WebhooksSection = 'configurar' | null;
type ApiKeySection = 'configurar' | null;

export default function Configuracoes() {
  const [activeSection, setActiveSection] = useState<MainSection>('disparo');
  const [disparoSection, setDisparoSection] = useState<DisparoSection>('parametros');
  const [crmSection, setCrmSection] = useState<CrmSection>('fontes');
  const [conversasSection, setConversasSection] = useState<ConversasSectionType>('assinatura');
  const [usuariosSection, setUsuariosSection] = useState<UsuariosSection>('gerenciar');
  const [webhooksSection, setWebhooksSection] = useState<WebhooksSection>('configurar');
  const [apiKeySection, setApiKeySection] = useState<ApiKeySection>('configurar');
  const [showUsers, setShowUsers] = useState(false);
  const [showWebhooks, setShowWebhooks] =  useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const canEditConfigs = hasPermission('can_edit_settings');
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get/tipo', {
          headers: { token }
        });
        
        if (!response.ok) {
          throw new Error('Erro ao verificar tipo de usuário');
        }

        const data = await response.json();
        const allowed = ['ADMIN', 'PARCEIRO', 'MASTER'].includes(data.tipo);
        setShowUsers(allowed);
        setShowWebhooks(allowed);
        setShowApiKey(allowed);
      } catch (err) {
        console.error('Erro ao verificar tipo de usuário:', err);
      }
    };

    checkUserType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mainSections = [
    { id: 'crm', label: 'CRM', icon: Database, show: true },
    { id: 'conversas', label: 'Conversas', icon: MessageSquare, show: true },
    { id: 'usuarios', label: 'Usuários', icon: Users, show: showUsers },
  ];

  const getCrmTabs = () => [
    { id: 'fontes', label: 'Fontes', component: FontesSection },
    { id: 'funis', label: 'Funis', component: FunisSection },
    { id: 'tags', label: 'Etiquetas', component: TagsSection },
    { id: 'campos', label: 'Campos personalizados', component: CamposSection }
  ];

  const getConversasTabs = () => [
    { id: 'assinatura', label: 'Assinatura', component: ConversasSection }
  ];

  const getUsuariosTabs = () => [
    { id: 'gerenciar', label: 'Gerenciar Usuários', component: UsersSection }
  ];

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Configurações</h1>
      
      {/* Main Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {mainSections.filter(section => section.show).map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id as MainSection);
                // Reset sub-sections when changing main section
                if (section.id === 'disparo') setDisparoSection('parametros');
                if (section.id === 'crm') setCrmSection('fontes');
                if (section.id === 'conversas') setConversasSection('assinatura');
                if (section.id === 'usuarios') setUsuariosSection('gerenciar');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* CRM Sub-tabs */}
      {activeSection === 'crm' && (
        <div>
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            {getCrmTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCrmSection(tab.id as CrmSection)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  crmSection === tab.id
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {getCrmTabs().map((tab) => 
            tab.id === crmSection && tab.component && (
<tab.component key={tab.id} isActive={true} canEdit={canEditConfigs} />
            )
          )}
        </div>
      )}

      {/* Conversas Sub-tabs */}
      {activeSection === 'conversas' && (
        <div>
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            {getConversasTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setConversasSection(tab.id as ConversasSectionType)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  conversasSection === tab.id
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {getConversasTabs().map((tab) =>
            tab.id === conversasSection && tab.component && (
              <tab.component key={tab.id} isActive={true} canEdit={canEditConfigs} />
            )
          )}
        </div>
      )}

      {/* Usuários Sub-tabs */}
      {activeSection === 'usuarios' && (
        <div>
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            {getUsuariosTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setUsuariosSection(tab.id as UsuariosSection)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  usuariosSection === tab.id
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {getUsuariosTabs().map((tab) => 
            tab.id === usuariosSection && tab.component && (
<tab.component key={tab.id} isActive={true} canEdit={canEditConfigs} />
            )
          )}
        </div>
      )}
    </div>
  );
}