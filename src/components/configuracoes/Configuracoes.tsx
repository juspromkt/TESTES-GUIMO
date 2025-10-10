import React, { useEffect, useState } from "react";
import { Database, Users, Tag } from "lucide-react";
import ConfigLayout from "./ConfigLayout";

import FontesSection from "./FontesSection";
import FunisSection from "./FunisSection";
import CamposSection from "./CamposSection";
import TagsSection from "./TagsSection";
import UsersSection from "./UsersSection";

import { hasPermission } from "../../utils/permissions";
import type { UserType } from "../../types/user";

type SectionId = "funis" | "fontes" | "campos" | "etiquetas" | "usuarios";

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

  // Sidebar limpinha: funil, fontes, campos, etiquetas, usuários
  const sections = [
    { id: "funis", label: "Status do Lead", icon: Database, show: true },
    { id: "fontes", label: "Origem do Lead", icon: Database, show: true },
    { id: "campos", label: "Campos personalizados", icon: Database, show: true },
    { id: "etiquetas", label: "Etiquetas", icon: Tag, show: true },
    { id: "usuarios", label: "Gestão de Usuários", icon: Users, show: showUsers },
    // Webhooks e Chave de API ocultos por enquanto
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
      case "usuarios":
        return <UsersSection isActive={true} canEdit={canEditConfigs} />;
      default:
        return null;
    }
  };

  return (
    <ConfigLayout
      title="Configurações"
      description="Painel central de configurações do sistema."
      sections={sections.filter((s) => s.show)}
      activeSection={activeSection}
      setActiveSection={(id) => setActiveSection(id as SectionId)}
    >
      {renderSection()}
    </ConfigLayout>
  );
}
