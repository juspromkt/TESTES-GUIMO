import React, { useState } from 'react';
import { ExternalLink, X, Handshake, TrendingUp, GraduationCap, Package, Building2 } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  description: string;
  bannerUrl: string;
  link: string;
  category: 'trafego' | 'cursos' | 'sistemas' | 'empresas';
  whatsapp?: string;
}

type CategoryType = 'trafego' | 'cursos' | 'sistemas' | 'empresas';

// Dados de exemplo dos parceiros
const partnersData: Partner[] = [
  {
    id: '1',
    name: 'Agência Tráfego Pro',
    description: 'Especialistas em tráfego pago e campanhas estratégicas para aumentar suas conversões',
    bannerUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&q=80',
    link: 'https://parceiro1.com',
    category: 'trafego',
    whatsapp: '5511999999999'
  },
  {
    id: '2',
    name: 'Meta Ads Academy',
    description: 'Curso completo de Facebook e Instagram Ads do básico ao avançado',
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop&q=80',
    link: 'https://parceiro2.com',
    category: 'cursos',
    whatsapp: '5511988888888'
  },
  {
    id: '3',
    name: 'CRM Plus',
    description: 'Sistema completo de gestão de relacionamento com cliente integrado',
    bannerUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80',
    link: 'https://parceiro3.com',
    category: 'sistemas',
    whatsapp: '5511977777777'
  },
  {
    id: '4',
    name: 'Tech Solutions Ltd',
    description: 'Empresa parceira especializada em soluções corporativas e consultoria',
    bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop&q=80',
    link: 'https://parceiro4.com',
    category: 'empresas',
    whatsapp: '5511966666666'
  },
  {
    id: '5',
    name: 'Google Ads Expert',
    description: 'Gestão profissional de campanhas Google Ads com foco em ROI',
    bannerUrl: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=450&fit=crop&q=80',
    link: 'https://parceiro5.com',
    category: 'trafego',
    whatsapp: '5511955555555'
  },
  {
    id: '6',
    name: 'Marketing Digital 360',
    description: 'Curso avançado de marketing digital e estratégias de vendas online',
    bannerUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop&q=80',
    link: 'https://parceiro6.com',
    category: 'cursos',
    whatsapp: '5511944444444'
  }
];

const categories = [
  { id: 'trafego', label: 'Tráfego Pago', icon: TrendingUp },
  { id: 'cursos', label: 'Cursos', icon: GraduationCap },
  { id: 'sistemas', label: 'Sistemas', icon: Package },
  { id: 'empresas', label: 'Empresas', icon: Building2 },
] as const;

const ParceirosSidebar: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('trafego');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
  };

  const handleCloseModal = () => {
    setSelectedPartner(null);
  };

  const handleVisitPartner = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppContact = (whatsapp: string) => {
    window.open(`https://wa.me/${whatsapp}`, '_blank', 'noopener,noreferrer');
  };

  const filteredPartners = partnersData.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4 sm:p-6 transition-theme">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-300 dark:border-neutral-700 p-6 transition-theme">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100">
              Parceiros
            </h2>
          </div>

          <nav className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-neutral-500'
                    }`}
                  />
                  <span className="truncate">{category.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-300 dark:border-neutral-700 transition-theme overflow-y-auto">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">
                {categories.find(c => c.id === selectedCategory)?.label}
              </h1>
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                Explore nossos parceiros nesta categoria
              </p>
            </div>

            {/* Grid de parceiros */}
            {filteredPartners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    onClick={() => handlePartnerClick(partner)}
                    className="group relative bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400"
                  >
                    {/* Banner Image */}
                    <div className="relative w-full aspect-video overflow-hidden">
                      <img
                        src={partner.bannerUrl}
                        alt={partner.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Hover icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white dark:bg-neutral-800 rounded-full p-3 shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                          <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>

                    {/* Info section */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {partner.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2">
                        {partner.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-block p-6 bg-gray-100 dark:bg-neutral-900 rounded-full mb-4">
                  <ExternalLink className="w-12 h-12 text-gray-400 dark:text-neutral-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum parceiro nesta categoria
                </h3>
                <p className="text-gray-600 dark:text-neutral-400">
                  Em breve teremos novos parceiros para você conhecer
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de detalhes do parceiro */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-800 rounded-full shadow-lg transition-all duration-200 group"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-gray-700 dark:text-neutral-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            </button>

            {/* Banner */}
            <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
              <img
                src={selectedPartner.bannerUrl}
                alt={selectedPartner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Title */}
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedPartner.name}
              </h2>

              {/* Description */}
              <p className="text-gray-700 dark:text-neutral-300 text-lg leading-relaxed mb-8">
                {selectedPartner.description}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* WhatsApp Button */}
                {selectedPartner.whatsapp && (
                  <button
                    onClick={() => handleWhatsAppContact(selectedPartner.whatsapp!)}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-500 dark:hover:to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                    >
                      <path d="M16.61 14.18c-.27-.14-1.62-.8-1.87-.9-.25-.09-.43-.14-.61.14-.18.27-.7.9-.85 1.09-.16.18-.31.2-.58.07-.27-.14-1.15-.43-2.19-1.37-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.42.12-.56.13-.13.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.45-.61-.45-.16 0-.34-.02-.52-.02s-.48.07-.73.34c-.25.27-.96.93-.96 2.27s.98 2.64 1.12 2.82c.13.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.24.18 1.71.11.52-.08 1.62-.66 1.85-1.3.23-.65.23-1.2.16-1.32-.06-.12-.25-.2-.52-.34z" />
                      <path d="M12.04 2C6.51 2 2 6.5 2 12c0 2.06.68 3.97 1.83 5.52L2 22l4.61-1.77A9.93 9.93 0 0 0 12.04 22c5.53 0 10.04-4.5 10.04-10S17.57 2 12.04 2zm0 18.09a8.1 8.1 0 0 1-4.13-1.15l-.3-.18-2.73 1.05.73-2.64-.18-.27A8.07 8.07 0 1 1 12.04 20.1z" />
                    </svg>
                    <span>Falar no WhatsApp</span>
                  </button>
                )}

                {/* Visit Site Button */}
                <button
                  onClick={() => handleVisitPartner(selectedPartner.link)}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 text-gray-900 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-gray-300 dark:border-neutral-600"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Visitar site</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParceirosSidebar;
