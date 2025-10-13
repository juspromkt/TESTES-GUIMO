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
      absolute right-0 top-0 h-full
      bg-white border-l border-gray-200 shadow-lg
      transition-all duration-300 ease-in-out
      flex flex-col z-40
      ${isOpen ? "w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden"}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Buscar Mensagens</h3>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar mensagens nesta conversa..."
            value={searchQuery}
            onChange={(e) => handleSearchMessages(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Buscar Mensagens</h4>
            <p className="text-sm text-gray-500">
              Digite algo no campo acima para pesquisar mensagens desta conversa
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum resultado encontrado</h4>
            <p className="text-sm text-gray-500">
              Tente usar termos diferentes
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-2 bg-gray-50 sticky top-0">
              <p className="text-xs font-medium text-gray-600">
                {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
              </p>
            </div>
            {searchResults.map((msg) => {
              const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
              const highlightedText = text.replace(
                new RegExp(`(${searchQuery})`, 'gi'),
                '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>'
              );

              return (
                <button
                  key={msg.id}
                  onClick={() => {
                    onMessageClick(msg.id);
                    onToggle();
                  }}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900">
                          {msg.key.fromMe ? 'Você' : (msg.pushName || 'Usuário')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(msg.messageTimestamp)}
                        </span>
                      </div>
                      <p
                        className="text-sm text-gray-700 line-clamp-2"
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
