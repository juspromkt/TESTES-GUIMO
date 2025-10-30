import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, StopCircle, FileText, Smile } from "lucide-react";
import { apiClient } from "./utils/api";
import type { Message } from "./utils/api";
import { toast } from "sonner";
import { resolveJid } from "../../utils/jidMapping";
import * as Popover from "@radix-ui/react-popover";

interface MessageInputProps {
  remoteJid: string;
  onMessageSent: (newMessages: Message[]) => void;
  onTempMessage?: (msg: Message) => void;
  onMessageError?: (tempId: string) => void;
  onReplaceTempMessage?: (tempId: string, newMessages: Message[]) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  replyTo?: Message | null;
  onClearReply?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  isBusiness?: boolean;
  onTemplateClick?: () => void;
}

export function MessageInput({
 remoteJid,
  onMessageSent,
  onTempMessage,
  onMessageError,
  onReplaceTempMessage,
  fileInputRef,
  replyTo,
  onClearReply,
  inputRef,
  isBusiness,
  onTemplateClick,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const internalRef = useRef<HTMLInputElement>(null);
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalInputRef; // Usar a ref passada ou interna
  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    base64: string;
    mediatype: "image" | "video" | "document";
    mimetype: string;
  } | null>(null);
const [audioPreview, setAudioPreview] = useState<{ blob: Blob; url: string; base64: string } | null>(null);

   const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

const reader = new FileReader();
reader.onloadend = async () => {
  const base64data = reader.result?.toString().split(",")[1];

  if (base64data) {
    setAudioPreview({
      blob: audioBlob,
      url: URL.createObjectURL(audioBlob),
      base64: base64data,
    });
  }
};

reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
      toast("Gravando... 🎙️ (clique para parar)");

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      toast.error("Erro ao acessar microfone");
    }
  };

  // FUNÇÃO PARA PARAR A GRAVAÇÃO
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const handleSendMessage = () => {
    if ((!message.trim() && !pendingFile && !audioPreview) || !token) return;

    const tempId = `temp-${Date.now()}`;
    let tempMessage: Message | null = null;
    const timestamp = Math.floor(Date.now() / 1000);
    const jid = resolveJid(remoteJid);

    if (audioPreview) {
      tempMessage = {
        id: tempId,
        key: { id: tempId, fromMe: true, remoteJid: jid },
        messageType: 'audioMessage',
        message: { mediaUrl: audioPreview.url },
        messageTimestamp: timestamp,
        status: 'pending'
      };
      onTempMessage?.(tempMessage);
    } else if (pendingFile) {
      const msgType =
        pendingFile.mediatype === 'image'
          ? 'imageMessage'
          : pendingFile.mediatype === 'video'
          ? 'videoMessage'
          : 'documentMessage';
      tempMessage = {
        id: tempId,
        key: { id: tempId, fromMe: true, remoteJid: jid },
        messageType: msgType,
        message: {
          mediaUrl: `data:${pendingFile.mimetype};base64,${pendingFile.base64}`,
        },
        messageTimestamp: timestamp,
        status: 'pending'
      };
      onTempMessage?.(tempMessage);
    } else {
      tempMessage = {
        id: tempId,
        key: { id: tempId, fromMe: true, remoteJid: jid },
        messageType: 'conversation',
        message: { conversation: message.trim() },
        messageTimestamp: timestamp,
        status: 'pending'
      };
      onTempMessage?.(tempMessage);
    }

    setMessage('');
    setPendingFile(null);
    setAudioPreview(null);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);

    (async () => {
      try {
        let sentMessages: Message[] = [];
        if (audioPreview) {
          console.log('[MessageInput] Enviando áudio...', { jid, mimetype: 'audio/mp3' });
          sentMessages = await apiClient.sendMessage(token, {
            jid: jid,
            mediatype: 'audio',
            mimetype: 'audio/mp3',
            base64: audioPreview.base64,
            fileName: `audio-${Date.now()}.mp3`,
            resposta: replyTo
              ? {
                  idMensagem: replyTo.key.id,
                  mensagem: replyTo.message.conversation || '',
                }
              : undefined,
          });
        } else if (pendingFile) {
          console.log('[MessageInput] Enviando arquivo...', {
            jid,
            mediatype: pendingFile.mediatype,
            mimetype: pendingFile.mimetype,
            fileName: pendingFile.file.name,
            size: pendingFile.file.size
          });
          sentMessages = await apiClient.sendMessage(token, {
            jid: jid,
            mediatype: pendingFile.mediatype,
            mimetype: pendingFile.mimetype,
            base64: pendingFile.base64,
            resposta: replyTo
              ? {
                  idMensagem: replyTo.key.id,
                  mensagem: replyTo.message.conversation || '',
                }
              : undefined,
            fileName: pendingFile.file.name,
          });
        } else {
          console.log('[MessageInput] Enviando texto...', { jid, text: message.trim() });
          sentMessages = await apiClient.sendMessage(token, {
            jid: jid,
            type: 'text',
            resposta: replyTo
              ? {
                  idMensagem: replyTo.key.id,
                  mensagem: replyTo.message.conversation || '',
                }
              : undefined,
            text: message.trim(),
          });
        }

        console.log('[MessageInput] Mensagens enviadas com sucesso:', sentMessages);
        onReplaceTempMessage?.(tempId, sentMessages);
        onMessageSent(sentMessages);
        toast.success('✨', { duration: 1000 });
      } catch (error) {
        console.error('[MessageInput] Erro ao enviar:', error);
        toast.error('Erro ao enviar');
        onMessageError?.(tempId);
      }
    })();
  };

  
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    // Validação de tamanho
    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande! Tamanho máximo: 16MB. Tamanho do arquivo: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      if (fileInputRef?.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];

        let mediatype: "image" | "video" | "document" = "document";
        if (file.type.startsWith("image/")) mediatype = "image";
        else if (file.type.startsWith("video/")) mediatype = "video";

        setPendingFile({
          file,
          base64: base64Data,
          mediatype,
          mimetype: file.type,
        });

        toast.success(`Arquivo selecionado: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Erro ao processar arquivo");
    }

    if (fileInputRef?.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Lista de emojis mais usados (estilo WhatsApp)
  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
    "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
    "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
    "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
    "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
    "🤧", "🥵", "🥶", "😶‍🌫️", "🥴", "😵", "🤯", "🤠", "🥳", "😎",
    "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺",
    "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣",
    "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "👍",
    "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞", "🤟",
    "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐",
    "✋", "🖖", "👌", "🤏", "✊", "👊", "🤛", "🤜", "💪", "❤️",
    "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️",
    "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🔥", "✨", "💫"
  ];

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  // Auto-resize do textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);
 return (
    <div className="bg-[#f0f2f5] dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 relative z-[9998] transition-colors duration-200" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      {/* Preview de arquivo selecionado */}
      {pendingFile && (
        <div className="px-3 md:px-4 py-3 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            {pendingFile.mediatype === 'image' && (
              <img
                src={`data:${pendingFile.mimetype};base64,${pendingFile.base64}`}
                alt="preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            {pendingFile.mediatype === 'video' && (
              <video
                src={`data:${pendingFile.mimetype};base64,${pendingFile.base64}`}
                className="w-16 h-16 object-cover rounded-lg"
                controls={false}
              />
            )}
            {pendingFile.mediatype === 'document' && (
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{pendingFile.file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{(pendingFile.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => setPendingFile(null)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Preview de áudio gravado */}
      {audioPreview && (
        <div className="px-4 py-3 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <audio controls src={audioPreview.url} className="flex-1" />
            <button
              onClick={() => setAudioPreview(null)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Responder a mensagem */}
      {replyTo && (
        <div className="px-4 py-2 bg-[#d1f4cc] dark:bg-emerald-900/40 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#00a884] dark:text-emerald-400">Respondendo</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                {replyTo.message.conversation?.slice(0, 50)}...
              </p>
            </div>
            <button
              onClick={() => onClearReply?.()}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-2 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input principal - estilo WhatsApp Web */}
      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-2">
        <input
          ref={fileInputRef || internalRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Lado esquerdo: Emoji + Anexo */}
        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          {/* Botão Emoji com Popover */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="p-1.5 md:p-2 text-[#54656f] dark:text-gray-400 hover:text-[#00a884] dark:hover:text-emerald-400 active:text-[#008f6f] transition-colors rounded-full hover:bg-[#f0f2f5] dark:hover:bg-gray-700 active:bg-[#e1e3e5] dark:active:bg-gray-600 touch-manipulation"
                title="Emoji"
                aria-label="Selecionar emoji"
              >
                <Smile className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content
                className="z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden w-[300px] md:w-[350px] animate-in fade-in-0 zoom-in-95 transition-colors duration-200"
                sideOffset={8}
                align="start"
              >
                <div className="p-2 md:p-3">
                  <div className="grid grid-cols-7 md:grid-cols-8 gap-0.5 md:gap-1 max-h-[250px] md:max-h-[300px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl md:text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded p-1.5 md:p-2 transition-colors touch-manipulation"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Botão Anexar */}
          <button
            type="button"
            onClick={() => (fileInputRef || internalRef).current?.click()}
            className="p-1.5 md:p-2 text-[#54656f] dark:text-gray-400 hover:text-[#00a884] dark:hover:text-emerald-400 active:text-[#008f6f] transition-colors rounded-full hover:bg-[#f0f2f5] dark:hover:bg-gray-700 active:bg-[#e1e3e5] dark:active:bg-gray-600 touch-manipulation"
            title="Anexar arquivo"
            aria-label="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Botão Template (se business) */}
          {isBusiness && (
            <button
              type="button"
              onClick={onTemplateClick}
              className="p-1.5 md:p-2 text-[#54656f] dark:text-gray-400 hover:text-[#00a884] dark:hover:text-emerald-400 active:text-[#008f6f] transition-colors rounded-full hover:bg-[#f0f2f5] dark:hover:bg-gray-700 active:bg-[#e1e3e5] dark:active:bg-gray-600 touch-manipulation"
              title="Template"
              aria-label="Selecionar template"
            >
              <FileText className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </div>

        {/* Campo de input */}
        {recording ? (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg py-2.5 px-4 transition-colors duration-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Gravando áudio...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg transition-colors duration-200">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem"
              rows={1}
              className="w-full resize-none rounded-lg bg-transparent px-3 py-2.5 text-base md:text-[15px] text-[#111b21] dark:text-gray-100 placeholder:text-[#667781] dark:placeholder:text-gray-400 focus:outline-none overflow-y-auto touch-manipulation"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                height: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            />
          </div>
        )}

        {/* Lado direito: Áudio ou Enviar */}
        {message.trim() || pendingFile || audioPreview ? (
          <button
            type="button"
            onClick={handleSendMessage}
            className="p-2 md:p-2.5 text-white bg-[#00a884] dark:bg-emerald-600 hover:bg-[#008f6f] dark:hover:bg-emerald-700 active:bg-[#007a65] dark:active:bg-emerald-800 transition-colors rounded-full flex-shrink-0 touch-manipulation active:scale-95"
            title="Enviar"
            aria-label="Enviar mensagem"
          >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        ) : (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`p-2 md:p-2.5 transition-colors rounded-full flex-shrink-0 touch-manipulation active:scale-95 ${
              recording
                ? 'text-white bg-red-500 hover:bg-red-600 active:bg-red-700'
                : 'text-[#54656f] dark:text-gray-400 hover:text-[#00a884] dark:hover:text-emerald-400 active:text-[#008f6f] hover:bg-[#f0f2f5] dark:hover:bg-gray-700 active:bg-[#e1e3e5] dark:active:bg-gray-600'
            }`}
            title={recording ? "Parar gravação" : "Gravar áudio"}
            aria-label={recording ? "Parar gravação" : "Gravar áudio"}
          >
            {recording ? <StopCircle className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        )}
      </div>
    </div>
  );
}