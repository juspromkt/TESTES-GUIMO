import React from "react";
import { Users, KanbanSquare } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

// Layout lateral de abas
import CRMLayout from "./CRMLayout";

export default function CRMLayoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determina a seção ativa baseada na URL
  const activeSection = location.pathname.includes('/contatos') ? 'contatos' : 'crm';

  const sections = [
    { id: "crm", label: "Kanban CRM", icon: KanbanSquare },
    { id: "contatos", label: "Contatos", icon: Users },
  ];

  // Navegação baseada em URL ao invés de setState
  const handleSetActiveSection = (sectionId: string) => {
    if (sectionId === 'contatos') {
      navigate('/crm/contatos');
    } else {
      navigate('/crm/kanban');
    }
  };

  return (
    <CRMLayout
      sections={sections}
      activeSection={activeSection}
      setActiveSection={handleSetActiveSection}
    >
      <Outlet />
    </CRMLayout>
  );
}
