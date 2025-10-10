import React from "react";
import { LucideIcon } from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

interface ConfigLayoutProps {
  title: string;
  description: string;
  sections: Section[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  children: React.ReactNode;
}

export default function ConfigLayout({
  title,
  description,
  sections,
  activeSection,
  setActiveSection,
  children,
}: ConfigLayoutProps) {
  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Configurações</h2>
        <nav className="flex flex-col gap-1">
          {sections
            .filter((section) => section.show)
            .map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 w-full text-sm px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-gray-500"}`} />
                  <span>{section.label}</span>
                </button>
              );
            })}
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </header>

        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
