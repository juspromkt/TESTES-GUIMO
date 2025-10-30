import React, { useEffect, useState } from "react";
import { GitBranch, Globe2, ListChecks, Tag, Users2, Link2, Building2, Activity } from "lucide-react";
import ConfigLayout from "./ConfigLayout";

import FontesSection from "./FontesSection";
import FunisSection from "./FunisSection";
import CamposSection from "./CamposSection";
import TagsSection from "./TagsSection";
import UsersSection from "./UsersSection";
import DepartamentosSection from "./DepartamentosSection";
import Conexao from "../../pages/Conexao";
import DiagnosticSection from "../ai-agent/DiagnosticSection";


import { hasPermission } from "../../utils/permissions";
import type { UserType } from "../../types/user";

// adiciona "conexao" e "departamentos" ao tipo
type SectionId = "funis" | "fontes" | "campos" | "etiquetas" | "departamentos" | "usuarios" | "conexao" | "diagnostico";

export default function Configuracoes() {
  const [activeSection, setActiveSection] = useState<SectionId>("funis");
  const [showUsers, setShowUsers] = useState(false);

  const canEditConfigs = hasPermission("can_edit_settings");

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const response = await fetch(
          "https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get/tipo",
          { headers: { token } }
        );
        if (!response.ok) throw new Error("Erro ao verificar tipo de usuário");
        const data: UserType = await response.json();
        const allowed = ["ADMIN", "PARCEIRO", "MASTER"].includes(data.tipo);
        setShowUsers(allowed);
      } catch (err) {
        console.error("Erro ao verificar tipo de usuário:", err);
      }
    };
    checkUserType();
  }, [token]);

  // Sidebar com ícones coerentes
  const sections = [
    { id: "funis", label: "Funis de Vendas", icon: GitBranch, show: true },
    { id: "fontes", label: "Origem do Lead", icon: Globe2, show: true },
    { id: "campos", label: "Campos Personalizados", icon: ListChecks, show: true },
    { id: "etiquetas", label: "Etiquetas", icon: Tag, show: true },
    { id: "departamentos", label: "Departamentos", icon: Building2, show: true },
    { id: "conexao", label: "Conexões", icon: Link2, show: true },
    { id: "usuarios", label: "Gestão de Usuários", icon: Users2, show: showUsers },
    { id: "diagnostico", label: "Diagnóstico", icon: Activity, show: true },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "funis":
        return <FunisSection isActive={true} canEdit={canEditConfigs} />;
      case "fontes":
        return <FontesSection isActive={true} canEdit={canEditConfigs} />;
      case "campos":
        return <CamposSection isActive={true} canEdit={canEditConfigs} />;
      case "etiquetas":
        return <TagsSection isActive={true} canEdit={canEditConfigs} />;
      case "departamentos":
        return <DepartamentosSection isActive={true} canEdit={canEditConfigs} />;
      case "conexao":
        return <Conexao isActive={true} canEdit={canEditConfigs} />;
      case "usuarios":
        return <UsersSection isActive={true} canEdit={canEditConfigs} />;
      case "diagnostico":
        return <DiagnosticSection token={token} />;
      default:
        return null;
    }
  };

  return (
    <ConfigLayout
      title="Configurações"
      description=""
      sections={sections.filter((s) => s.show)}
      activeSection={activeSection}
      setActiveSection={(id) => setActiveSection(id as SectionId)}
    >
      {renderSection()}
    </ConfigLayout>
  );
}
