import React, { useState, useEffect } from 'react';
import { Bot, Loader2, Copy, Download, FileText, Check, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface DealSummaryWidgetProps {
  dealId: number;
  contactName?: string;
  contactPhone?: string;
}

export default function DealSummaryWidget({ dealId, contactName, contactPhone }: DealSummaryWidgetProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchSummary();
  }, [dealId]);

  const fetchSummary = async () => {
    if (!dealId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/crm/resumo/get?id_negociacao=${dealId}`,
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar resumo');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].resumo) {
        setSummary(data[0].resumo);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
      setError('Erro ao carregar resumo');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSummary = async () => {
    if (!dealId) return;

    setCreating(true);
    setError(null);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/crm/resumo/create?id_negociacao=${dealId}`,
        { method: 'POST', headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao criar resumo');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].resumo) {
        setSummary(data[0].resumo);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error('Erro ao criar resumo:', err);
      setError('Erro ao criar resumo');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const generateFileName = () => {
    const name = contactName || 'Lead';
    const phone = contactPhone || 'Sem-telefone';
    const cleanPhone = phone.replace(/\D/g, '');
    return `${name} - ${cleanPhone} - Resumo do caso`;
  };

  const handleDownloadTXT = () => {
    if (!summary) return;

    const fileName = generateFileName();
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!summary) return;

    const fileName = generateFileName();
    const pdf = new jsPDF();

    // Configurações
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 7;

    // Título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resumo da Negociação', margin, margin);

    // Info do contato
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let yPosition = margin + 10;

    if (contactName) {
      pdf.text(`Nome: ${contactName}`, margin, yPosition);
      yPosition += 6;
    }

    if (contactPhone) {
      pdf.text(`Telefone: ${contactPhone}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // Linha divisória
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Conteúdo do resumo
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    // Quebra o texto em linhas
    const lines = pdf.splitTextToSize(summary, maxWidth);

    for (let i = 0; i < lines.length; i++) {
      if (yPosition + lineHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(lines[i], margin, yPosition);
      yPosition += lineHeight;
    }

    // Rodapé
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    pdf.save(`${fileName}.pdf`);
  };

  return (
    <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-colors duration-200">
      {/* Header - sempre visível */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Resumo do atendimento</h3>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Conteúdo - colapsável */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pode levar cerca de 1 minuto para gerar um resumo.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600 dark:text-violet-400" />
            </div>
          ) : summary ? (
            <div className="space-y-3">
              {/* Texto do resumo */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 max-h-[200px] overflow-y-auto transition-colors duration-200">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-200 font-sans">
                  {summary}
                </pre>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadTXT}
                    className="flex items-center justify-center gap-2 flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>TXT</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 flex-1 px-3 py-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                </div>

                {/* Botão Gerar novo resumo */}
                <button
                  onClick={handleCreateSummary}
                  disabled={creating}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-violet-600 dark:bg-violet-700 hover:bg-violet-700 dark:hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando novo resumo...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Gerar novo resumo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg transition-colors duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateSummary}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 dark:bg-violet-700 hover:bg-violet-700 dark:hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando resumo...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>Gerar resumo</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Nenhum resumo disponível
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
