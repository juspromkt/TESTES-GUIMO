import React, { useState, useEffect } from "react";
import ProspectarForm from "../components/prospectar/ProspectarForm";
import ProspectarHistory from "../components/prospectar/ProspectarHistory";
import DirectDispatchHistory from "../components/prospectar/DirectDispatchHistory";
import ProspectarLayout from "./ProspectarLayout";

import ModelosSection from "../components/configuracoes/ModelosSection";
import ParametrosSection from "../components/configuracoes/ParametrosSection";

import { hasPermission } from "../utils/permissions";

type SectionType = "prospectar" | "disparo-direto" | "modelos" | "parametros";

export default function Prospectar() {
  const canViewBusca = hasPermission("can_view_prospeccao_busca");
  const canViewDd = hasPermission("can_view_prospeccao_dd");
  const canEditConfigs = hasPermission("can_edit_settings");

  // 🟢 Agora a aba padrão é sempre "disparo-direto"
  const [activeSection, setActiveSection] = useState<SectionType>("disparo-direto");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleProspeccaoCreated = () => setHistoryRefresh((prev) => prev + 1);

  useEffect(() => {
    // Garantir que não caia numa aba sem permissão
    if (activeSection === "prospectar" && !canViewBusca) {
      if (canViewDd) setActiveSection("disparo-direto");
    } else if (activeSection === "disparo-direto" && !canViewDd) {
      if (canViewBusca) setActiveSection("prospectar");
    }
  }, [activeSection, canViewBusca, canViewDd]);

  // 👉 Sidebar sem o item "Prospectar Segmento"
  const sections = [
    { id: "disparo-direto", label: "Lista de envios" },
    { id: "modelos", label: "Modelos de Mensagem" },
    { id: "parametros", label: "Configurações de envio" },
  ];

  return (
    <ProspectarLayout
      sections={sections}
      activeSection={activeSection}
      setActiveSection={(id) => setActiveSection(id as SectionType)}
    >
      {/* 🔒 A aba "Prospectar Segmento" ainda existe, mas fica oculta */}
      {activeSection === "prospectar" && canViewBusca && (
        <>
          <ProspectarForm onProspeccaoCreated={handleProspeccaoCreated} />
          <ProspectarHistory refreshTrigger={historyRefresh} />
        </>
      )}

      {activeSection === "disparo-direto" && canViewDd && (
        <DirectDispatchHistory />
      )}

      {activeSection === "modelos" && (
        <ModelosSection isActive={true} canEdit={canEditConfigs} />
      )}

      {activeSection === "parametros" && (
        <ParametrosSection isActive={true} canEdit={canEditConfigs} />
      )}
    </ProspectarLayout>
  );
}
