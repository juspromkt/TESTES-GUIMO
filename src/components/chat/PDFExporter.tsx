import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };
  messageType: string;
  message: {
    conversation?: string;
    mediaUrl?: string;
    imageMessage?: {
      caption?: string;
      mimetype?: string;
      url?: string;
    };
    videoMessage?: {
      caption?: string;
      mimetype?: string;
    };
    audioMessage?: any;
    documentMessage?: {
      fileName?: string;
      mimetype?: string;
    };
  };
  messageTimestamp: number;
  status?: 'pending' | 'sent' | 'error' | 'FAILED' | 'SENT';
  isNote?: boolean;
  wasEdited?: boolean;
}

interface PDFExporterProps {
  messages: Message[];
  contactName: string;
  contactPhone: string;
}

export function PDFExporter({
  messages,
  contactName,
  contactPhone
}: PDFExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      // Se já é base64, retorna direto
      if (url.startsWith('data:')) {
        return url;
      }

      // Tentar carregar a imagem
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const base64 = canvas.toDataURL('image/jpeg', 0.8);
              resolve(base64);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Erro ao converter imagem:', error);
            resolve(null);
          }
        };

        img.onerror = () => {
          console.error('Erro ao carregar imagem:', url);
          resolve(null);
        };

        img.src = url;
      });
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      return null;
    }
  };

  const exportToPDF = async () => {
    if (messages.length === 0) {
      alert('Nenhuma mensagem para exportar.');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      // Criar um container temporário para renderizar o conteúdo que será exportado
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.width = '800px';
      exportContainer.style.background = '#ffffff';
      exportContainer.style.padding = '40px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(exportContainer);

      // Cabeçalho do PDF
      const header = document.createElement('div');
      header.style.marginBottom = '30px';
      header.style.borderBottom = '2px solid #00a884';
      header.style.paddingBottom = '20px';
      header.innerHTML = `
        <div style="text-align: center;">
          <h1 style="margin: 0; color: #00a884; font-size: 24px; font-weight: bold;">
            Histórico de Conversa Guimoo
          </h1>
          <div style="margin-top: 10px; color: #666; font-size: 14px;">
            <strong>Contato:</strong> ${contactName}
          </div>
          <div style="color: #666; font-size: 14px;">
            <strong>Telefone:</strong> ${contactPhone}
          </div>
          <div style="color: #666; font-size: 14px;">
            <strong>Data da exportação:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </div>
          <div style="color: #666; font-size: 12px; margin-top: 5px;">
            Total de mensagens: ${messages.length}
          </div>
        </div>
      `;
      exportContainer.appendChild(header);

      // Container de mensagens
      const messagesContainer = document.createElement('div');
      messagesContainer.style.marginTop = '20px';

      setProgress(20);

      // Renderizar cada mensagem
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '15px';
        messageDiv.style.display = 'flex';
        messageDiv.style.flexDirection = msg.key.fromMe ? 'row-reverse' : 'row';
        messageDiv.style.gap = '10px';

        // Balão da mensagem
        const bubble = document.createElement('div');
        bubble.style.maxWidth = '70%';
        bubble.style.padding = '10px 15px';
        bubble.style.borderRadius = '10px';
        bubble.style.wordWrap = 'break-word';

        // Estilo baseado em quem enviou
        if (msg.key.fromMe) {
          bubble.style.background = '#dcf8c6';
          bubble.style.border = '1px solid #b8e6a0';
        } else {
          bubble.style.background = '#ffffff';
          bubble.style.border = '1px solid #e0e0e0';
        }

        // Nota interna
        if (msg.isNote) {
          bubble.style.background = '#fff9c4';
          bubble.style.border = '1px solid #f9a825';
        }

        // Conteúdo da mensagem
        let content = '';

        // Indicador de remetente
        const sender = msg.key.fromMe ? 'Você' : contactName;
        content += `<div style="font-weight: bold; color: ${msg.key.fromMe ? '#00a884' : '#667781'}; font-size: 12px; margin-bottom: 5px;">${sender}</div>`;

        // Tipo de mensagem
        switch (msg.messageType) {
          case 'conversation':
            const text = msg.message.conversation || '';
            // Escapar HTML para evitar injeção
            const escapedText = text
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
            content += `<div style="color: #000; font-size: 14px; white-space: pre-wrap;">${escapedText}</div>`;
            if (msg.wasEdited) {
              content += `<div style="font-size: 11px; color: #667781; font-style: italic; margin-top: 3px;">(editado)</div>`;
            }
            break;

          case 'imageMessage':
            // Tentar carregar imagem inline
            const imageUrl = msg.message.mediaUrl || msg.message.imageMessage?.url;
            if (imageUrl) {
              const base64Image = await loadImageAsBase64(imageUrl);
              if (base64Image) {
                content += `<img src="${base64Image}" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 5px;" />`;
              } else {
                content += `<div style="color: #667781; font-size: 13px;">📷 Imagem</div>`;
              }
            } else {
              content += `<div style="color: #667781; font-size: 13px;">📷 Imagem</div>`;
            }
            if (msg.message.imageMessage?.caption) {
              content += `<div style="color: #000; font-size: 14px; margin-top: 5px;">${msg.message.imageMessage.caption}</div>`;
            }
            break;

          case 'videoMessage':
            content += `<div style="color: #667781; font-size: 13px;">🎥 Vídeo</div>`;
            if (msg.message.videoMessage?.caption) {
              content += `<div style="color: #000; font-size: 14px; margin-top: 5px;">${msg.message.videoMessage.caption}</div>`;
            }
            break;

          case 'audioMessage':
            content += `<div style="color: #667781; font-size: 13px;">🎵 Áudio</div>`;
            break;

          case 'documentMessage':
            const docName = msg.message.documentMessage?.fileName || 'Documento';
            content += `<div style="color: #667781; font-size: 13px;">📄 ${docName}</div>`;
            break;

          case 'stickerMessage':
            content += `<div style="color: #667781; font-size: 13px;">🎨 Sticker</div>`;
            break;

          case 'note':
            content += `<div style="color: #000; font-size: 14px;">📝 ${msg.message.conversation || ''}</div>`;
            break;

          default:
            content += `<div style="color: #667781; font-size: 13px; font-style: italic;">[${msg.messageType}]</div>`;
        }

        // Timestamp e status
        const timestamp = formatDate(msg.messageTimestamp);
        let statusIcon = '';
        if (msg.key.fromMe) {
          switch (msg.status) {
            case 'pending':
              statusIcon = '⏱️';
              break;
            case 'sent':
            case 'SENT':
              statusIcon = '✓✓';
              break;
            case 'error':
            case 'FAILED':
              statusIcon = '❌';
              break;
            default:
              statusIcon = '✓';
          }
        }

        content += `<div style="font-size: 11px; color: #667781; text-align: right; margin-top: 5px;">${timestamp} ${statusIcon}</div>`;

        bubble.innerHTML = content;
        messageDiv.appendChild(bubble);
        messagesContainer.appendChild(messageDiv);

        // Atualizar progresso
        setProgress(20 + (60 * (i + 1)) / messages.length);
      }

      exportContainer.appendChild(messagesContainer);

      // Rodapé
      const footer = document.createElement('div');
      footer.style.marginTop = '40px';
      footer.style.paddingTop = '20px';
      footer.style.borderTop = '1px solid #e0e0e0';
      footer.style.textAlign = 'center';
      footer.style.fontSize = '11px';
      footer.style.color = '#999';
      footer.innerHTML = `
        <div>Exportado via Guimoo - Sistema de Gestão de Conversas</div>
        <div>www.guimoo.com.br</div>
      `;
      exportContainer.appendChild(footer);

      setProgress(85);

      // Converter para canvas
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      setProgress(90);

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Adicionar imagem ao PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      setProgress(95);

      // Salvar PDF
      const fileName = `Conversa_${contactName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      setProgress(100);

      // Limpar
      document.body.removeChild(exportContainer);

      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 500);

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar conversa para PDF. Por favor, tente novamente.');
      setIsExporting(false);
      setProgress(0);
    }
  };

  try {
    return (
      <button
        onClick={exportToPDF}
        disabled={isExporting || messages.length === 0}
        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed relative"
        title={isExporting ? `Exportando... ${Math.round(progress)}%` : 'Exportar conversa para PDF'}
        aria-label="Exportar conversa para PDF"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin" />
            {progress > 0 && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {Math.round(progress)}%
              </div>
            )}
          </>
        ) : (
          <FileDown className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white" />
        )}
      </button>
    );
  } catch (error) {
    console.error('Erro ao renderizar PDFExporter:', error);
    return null;
  }
}
