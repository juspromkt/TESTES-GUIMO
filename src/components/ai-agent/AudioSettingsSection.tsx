import React, { useEffect, useState } from 'react';
import { AudioPlayer } from '../chat/AudioPlayer';
import { Mic, Loader2, Volume2, Zap } from 'lucide-react';

interface AudioSettingsSectionProps {
  token: string;
  canEdit: boolean;
}
export default function AudioSettingsSection({ token, canEdit }: AudioSettingsSectionProps) {
  const [recordAudio, setRecordAudio] = useState(false);
  const [respondWithAudio, setRespondWithAudio] = useState(false);
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [alwaysRespondAudio, setAlwaysRespondAudio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const voices = ['Nova', 'Alloy', 'Echo', 'Fable', 'Onyx', 'Shimmer'];

  const previewUrl = voice ? `/audio/${voice.toLowerCase()}.mp3` : '';

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/audio', {
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
        console.error('Erro ao carregar configurações de áudio:', err);
        setError('Erro ao carregar configurações de áudio');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  // Auto-save quando qualquer configuração mudar (exceto no carregamento inicial)
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (!canEdit) return;

    autoSave();
  }, [recordAudio, respondWithAudio, alwaysRespondAudio, voice, rate]);

  // Handler para "Responder áudio com áudio"
  const handleRespondWithAudioChange = (checked: boolean) => {
    if (checked && alwaysRespondAudio) {
      setError('Você só pode ativar uma opção de resposta por vez. Desative "Sempre responder com áudio" primeiro.');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setRespondWithAudio(checked);
    setError('');
  };

  // Handler para "Sempre responder com áudio"
  const handleAlwaysRespondAudioChange = (checked: boolean) => {
    if (checked && respondWithAudio) {
      setError('Você só pode ativar uma opção de resposta por vez. Desative "Responder áudio com áudio" primeiro.');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setAlwaysRespondAudio(checked);
    setError('');
  };

  const autoSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/audio/create', {
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
          velocidade: rate
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações de áudio');
      }
    } catch (err) {
      console.error('Erro ao salvar configurações de áudio:', err);
      setError('Erro ao salvar configurações de áudio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-neutral-700/60 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-neutral-900 border-b border-gray-200/60 dark:border-neutral-700/60 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Ícone */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-md"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Mic className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configurações de Áudio</h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                  Configure como seu agente responderá com áudio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Indicador de salvamento */}
              {saving && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Salvando...</span>
                </div>
              )}

              {/* Toggle Principal */}
              {canEdit && (
                <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-800/80 px-4 py-2 rounded-xl border border-gray-200/60 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
                    Geração de Áudio
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={recordAudio}
                      onChange={(e) => setRecordAudio(e.target.checked)}
                      disabled={!canEdit}
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:to-teal-500"></div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Toggle Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Toggle 1 */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-950/10 rounded-2xl border border-gray-200/60 dark:border-neutral-700/60">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 rounded-lg shadow-md flex-shrink-0">
                <Volume2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Responder áudio com áudio</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={respondWithAudio}
                      onChange={(e) => handleRespondWithAudioChange(e.target.checked)}
                      disabled={!canEdit}
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:to-teal-500"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Se o lead enviar texto, responde com texto. Se enviar áudio, responde com áudio
                </p>
              </div>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-950/10 rounded-2xl border border-gray-200/60 dark:border-neutral-700/60">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-600 to-orange-500 rounded-lg shadow-md flex-shrink-0">
                <Mic className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sempre responder com áudio</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={alwaysRespondAudio}
                      onChange={(e) => handleAlwaysRespondAudioChange(e.target.checked)}
                      disabled={!canEdit}
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-amber-600 peer-checked:to-orange-500"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  A IA sempre responderá com áudio <span className="text-amber-600 dark:text-amber-400 font-medium">(não recomendado)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-emerald-600 to-teal-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
                Voz
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Select de voz */}
              <div>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition-all"
                >
                  <option value="">Selecione</option>
                  {voices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview do áudio */}
              {previewUrl && (
                <div className="p-4 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-950/10 rounded-xl border border-gray-200/60 dark:border-neutral-700/60">
                  <AudioPlayer url={previewUrl} />
                </div>
              )}
            </div>
          </div>

          {/* Speed Control */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-emerald-600 to-teal-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
                Velocidade da Fala
              </h3>
            </div>

            <div className="p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-950/10 rounded-2xl border border-gray-200/60 dark:border-neutral-700/60">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Ajuste a velocidade de reprodução do áudio
                </p>
                <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-lg">
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{rate.toFixed(1)}x</span>
                </div>
              </div>

              {/* Range Slider com marcadores visuais */}
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  disabled={!canEdit}
                  className="w-full h-3 bg-gray-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-emerald-600 [&::-webkit-slider-thumb]:to-teal-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-emerald-600 [&::-moz-range-thumb]:to-teal-500 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:border-0"
                />

                {/* Marcadores de velocidade */}
                <div className="flex justify-between mt-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-1 h-2 rounded-full ${rate === 1.0 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-gray-300 dark:bg-neutral-600'}`}></div>
                    <span className={`text-xs font-medium ${rate === 1.0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-neutral-400'}`}>1.0x</span>
                    <span className="text-[10px] text-gray-400 dark:text-neutral-500">Normal</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-1 h-2 rounded-full ${rate === 1.5 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-gray-300 dark:bg-neutral-600'}`}></div>
                    <span className={`text-xs font-medium ${rate === 1.5 ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-neutral-400'}`}>1.5x</span>
                    <span className="text-[10px] text-gray-400 dark:text-neutral-500">Natural</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-1 h-2 rounded-full ${rate === 2.0 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-gray-300 dark:bg-neutral-600'}`}></div>
                    <span className={`text-xs font-medium ${rate === 2.0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-neutral-400'}`}>2.0x</span>
                    <span className="text-[10px] text-gray-400 dark:text-neutral-500">Rápido</span>
                  </div>
                </div>
              </div>

              {/* Dica */}
              <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg">
                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5"></div>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <span className="font-semibold">Dica:</span> Velocidades entre 1.2x e 1.5x tornam a conversa mais natural e dinâmica
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-3 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}