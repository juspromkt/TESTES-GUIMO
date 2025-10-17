import React, { useState } from "react";
import { Users, KanbanSquare } from "lucide-react";

// Layout lateral de abas
import CRMLayout from "./CRMLayout";

// 👇 Importa o CRM original SEM alterar o arquivo
import CRM from "./CRM";

// Páginas já existentes
import Contatos from "./Contatos";

export default function CRMLayoutPage() {
  const [activeSection, setActiveSection] = useState("crm");

  const sections = [
    { id: "crm", label: "Kanban CRM", icon: KanbanSquare },
    { id: "contatos", label: "Contatos", icon: Users },
  ];

  return (
    <CRMLayout
      sections={sections}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    >
      {activeSection === "crm" && <CRM />}
      {activeSection === "contatos" && <Contatos />}
    </CRMLayout>
  );
}
