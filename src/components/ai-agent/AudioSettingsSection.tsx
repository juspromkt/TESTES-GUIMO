import { useEffect, useState } from 'react';
import { AudioPlayer } from '../chat/AudioPlayer';
import { Mic, Loader2, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface AudioSettingsSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
}

export default function AudioSettingsSection({ token, idAgente, canEdit }: AudioSettingsSectionProps) {
  const [recordAudio, setRecordAudio] = useState(false);
  const [respondWithAudio, setRespondWithAudio] = useState(false);
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [alwaysRespondAudio, setAlwaysRespondAudio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const toast = useToast();

  const voices = ['Nova', 'Alloy', 'Echo', 'Fable', 'Onyx', 'Shimmer'];

  const previewUrl = voice ? `/audio/${voice.toLowerCase()}.mp3` : '';

  useEffect(() => {
    fetchSettings();
  }, [idAgente]);

  // Auto-save quando houver mudanças
  useEffect(() => {
    if (loading) return;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleSave();
    }, 1000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordAudio, respondWithAudio, alwaysRespondAudio, voice, rate]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/audio?id_agente=${idAgente}`, {
        headers: { token }
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações de áudio');
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const settings = data[0];
        setRecordAudio(!!settings.gravar_audio);
        setRespondWithAudio(!!settings.responder_audio_com_audio);
        setAlwaysRespondAudio(!!settings.sempre_responder_com_audio);
        setVoice(settings.voz || '');
        setRate(settings.velocidade ?? 1);
      }
    } catch (err) {
      console.error('[AudioSettings] Erro ao carregar configurações de áudio:', err);
      toast.error('Erro ao carregar configurações de áudio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/audio/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          gravar_audio: recordAudio,
          responder_audio_com_audio: respondWithAudio,
          sempre_responder_com_audio: alwaysRespondAudio,
          voz: voice,
          velocidade: rate,
          id_agente: idAgente
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações de áudio');
      }

      toast.success('Configurações salvas!');
    } catch (err) {
      console.error('[AudioSettings] Erro ao salvar configurações de áudio:', err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggles de Configuração de Áudio */}
      <div className="grid grid-cols-1 gap-3">
        {/* Gerar Áudio com IA */}
        <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
          recordAudio
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
        } ${!canEdit ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            <Mic className={`h-4 w-4 ${recordAudio ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">Gerar Áudio com Agente</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                O Agente pode enviar respostas em formato de áudio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => canEdit && setRecordAudio(!recordAudio)}
            disabled={!canEdit}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
              recordAudio ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                recordAudio ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Responder Áudio com Áudio e Sempre Responder com Áudio - Mutuamente Exclusivos */}
        <div className="grid grid-cols-2 gap-3">
          {/* Responder Áudio com Áudio */}
          <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
            respondWithAudio
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          } ${!canEdit ? 'opacity-50' : ''}`}>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">Responder Áudio com Áudio</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Cliente envia áudio → Agente responde com áudio
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (canEdit) {
                  if (!respondWithAudio && alwaysRespondAudio) {
                    // Se está ativando este, desativa o outro
                    setAlwaysRespondAudio(false);
                  }
                  setRespondWithAudio(!respondWithAudio);
                }
              }}
              disabled={!canEdit}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
                respondWithAudio ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  respondWithAudio ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sempre Responder com Áudio */}
          <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
            alwaysRespondAudio
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          } ${!canEdit ? 'opacity-50' : ''}`}>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">Sempre Responder com Áudio</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Todas as mensagens do Agente em áudio
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (canEdit) {
                  if (!alwaysRespondAudio && respondWithAudio) {
                    // Se está ativando este, desativa o outro
                    setRespondWithAudio(false);
                  }
                  setAlwaysRespondAudio(!alwaysRespondAudio);
                }
              }}
              disabled={!canEdit}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
                alwaysRespondAudio ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alwaysRespondAudio ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Voz e Player na mesma linha */}
      <div className="grid grid-cols-2 gap-3">
        {/* Seletor de Voz */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <Mic className="h-3.5 w-3.5" />
            Voz do Agente
            <div className="group relative">
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                <p className="font-semibold mb-1">Escolha a voz do agente</p>
                <p className="text-gray-300">Selecione como você quer que o Agente soe nas mensagens de áudio. Cada voz tem uma personalidade única.</p>
              </div>
            </div>
          </label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">Selecione uma voz</option>
            {voices.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Player de Preview */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Prévia da Voz
            <div className="group relative">
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                <p className="font-semibold mb-1">Ouça como soa</p>
                <p className="text-gray-300">Teste a voz selecionada antes de salvar.</p>
              </div>
            </div>
          </label>
          {previewUrl ? (
            <AudioPlayer url={previewUrl} />
          ) : (
            <div className="flex items-center justify-center h-[42px] px-3 py-2 text-[11px] border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
              Selecione uma voz acima
            </div>
          )}
        </div>
      </div>

      {/* Velocidade */}
      <div>
        <label className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <Mic className="h-3.5 w-3.5" />
            Velocidade de Fala
            <div className="group relative">
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                <p className="font-semibold mb-1">Controle o ritmo da fala</p>
                <p className="text-gray-300 mb-2">Ajuste a rapidez com que o Agente fala nos áudios:</p>
                <ul className="text-gray-300 space-y-1 text-[10px]">
                  <li>• <span className="font-medium">0.5x-0.9x:</span> Mais devagar e pausado</li>
                  <li>• <span className="font-medium">1.0x:</span> Velocidade natural (recomendado)</li>
                  <li>• <span className="font-medium">1.1x-2.0x:</span> Mais rápido e dinâmico</li>
                </ul>
              </div>
            </div>
          </div>
          <span className="text-blue-600 dark:text-blue-400 font-mono">{rate.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          disabled={!canEdit}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          <span>Devagar</span>
          <span>Normal</span>
          <span>Rápido</span>
        </div>
      </div>
    </div>
  );
}
