import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Message, Chat } from "./utils/api";
import { formatMessageTime } from "./utils/dateUtils";

interface SearchSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  selectedChat: Chat | null;
  onMessageClick: (messageId: string) => void;
}

export default function SearchSidebar({
  isOpen,
  onToggle,
  messages,
  selectedChat,
  onMessageClick,
}: SearchSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);

  // Limpar busca quando fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  // Função para buscar mensagens
  const handleSearchMessages = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = messages.filter((msg) => {
      if (msg.messageType === 'conversation' || msg.messageType === 'extendedTextMessage') {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        return text.toLowerCase().includes(lowerQuery);
      }
      return false;
    });

    setSearchResults(filtered);
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed md:absolute right-0 top-[112px] md:top-0 h-full
      bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg
      transition-all duration-300 ease-in-out
      flex flex-col z-20
      ${isOpen ? "w-full md:w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none"}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Buscar Mensagens</h3>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar mensagens nesta conversa..."
            value={searchQuery}
            onChange={(e) => handleSearchMessages(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Buscar Mensagens</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Digite algo no campo acima para pesquisar mensagens desta conversa
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum resultado encontrado</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tente usar termos diferentes
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 sticky top-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
              </p>
            </div>
            {searchResults.map((msg) => {
              const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
              const highlightedText = text.replace(
                new RegExp(`(${searchQuery})`, 'gi'),
                '<mark class="bg-yellow-200 dark:bg-yellow-600 px-0.5 rounded">$1</mark>'
              );

              return (
                <button
                  key={msg.id}
                  onClick={() => {
                    onMessageClick(msg.id);
                    onToggle();
                  }}
                  className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {msg.key.fromMe ? 'Você' : (msg.pushName || 'Usuário')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageTime(msg.messageTimestamp)}
                        </span>
                      </div>
                      <p
                        className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: highlightedText }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
