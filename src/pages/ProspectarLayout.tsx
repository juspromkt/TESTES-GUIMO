import React from "react";
import { LucideIcon, Search, Rocket, MessageSquare, Settings2 } from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface ProspectarLayoutProps {
  sections: Section[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  children: React.ReactNode;
}

export default function ProspectarLayout({
  sections,
  activeSection,
  setActiveSection,
  children,
}: ProspectarLayoutProps) {
  const getIcon = (id: string): LucideIcon => {
    switch (id) {
      case "prospectar":
        return Search;
      case "disparo-direto":
        return Rocket;
      case "modelos":
        return MessageSquare;
      case "parametros":
        return Settings2;
      default:
        return Search;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar lateral */}
        <aside className="w-full lg:w-72 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-300 dark:border-neutral-700 p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100 mb-6">
            Envios em Massa
          </h2>

          <nav className="space-y-3">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon || getIcon(section.id);
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-100/80 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-800"
                      : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-700 hover:text-gray-800 dark:hover:text-neutral-200 border border-transparent hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-neutral-500"
                    }`}
                  />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-300 dark:border-neutral-700 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
