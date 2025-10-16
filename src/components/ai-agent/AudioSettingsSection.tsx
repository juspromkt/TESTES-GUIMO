import React, { useEffect, useState } from 'react';
import { AudioPlayer } from '../chat/AudioPlayer';
import { Mic, Save, Loader2, AlertCircle } from 'lucide-react';

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
  const [success, setSuccess] = useState('');

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

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

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

      setSuccess('Configurações de áudio salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-300 dark:border-neutral-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
        <Mic className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        Configurações de Áudio (Seu agente pode enviar e responder com áudio)
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={recordAudio}
              onChange={(e) => setRecordAudio(e.target.checked)}
              disabled={!canEdit}
            />
            <div
              className={`w-11 h-6 bg-gray-200 dark:bg-neutral-600 rounded-full peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-700 peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600 transition-all relative ${!canEdit ? 'opacity-50' : ''}`}
            >
              <span className="absolute top-[2px] left-[2px] h-5 w-5 bg-white border border-gray-300 dark:border-neutral-500 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
            <span className="ml-3 text-gray-700 dark:text-neutral-300">Ativar geração de áudio com IA (esse item deve estar ativado para que funcione)</span>
          </label>
        </div>


        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={respondWithAudio}
              onChange={(e) => setRespondWithAudio(e.target.checked)}
              disabled={!canEdit}
            />
            <div
              className={`w-11 h-6 bg-gray-200 dark:bg-neutral-600 rounded-full peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-700 peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600 transition-all relative ${!canEdit ? 'opacity-50' : ''}`}
            >
              <span className="absolute top-[2px] left-[2px] h-5 w-5 bg-white border border-gray-300 dark:border-neutral-500 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
            <span className="ml-3 text-gray-700 dark:text-neutral-300">Responder áudio com áudio (Se o lead enviar texto, ele responderá com texto. Se enviar áudio, responderá com áudio)</span>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={alwaysRespondAudio}
              onChange={(e) => setAlwaysRespondAudio(e.target.checked)}
              disabled={!canEdit}
            />
            <div
              className={`w-11 h-6 bg-gray-200 dark:bg-neutral-600 rounded-full peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-700 peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600 transition-all relative ${!canEdit ? 'opacity-50' : ''}`}
            >
              <span className="absolute top-[2px] left-[2px] h-5 w-5 bg-white border border-gray-300 dark:border-neutral-500 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
            <span className="ml-3 text-gray-700 dark:text-neutral-300">Sempre responder com áudio (A IA sempre responderá com áudio (não recomendado, mas a escolha é sua)</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Voz</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-md border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 shadow-sm focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500 dark:focus:ring-emerald-400"
          >
            <option value="">Selecione</option>
            {voices.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        {previewUrl && (
          <div className="mt-2">
            <AudioPlayer url={previewUrl} />
          </div>
        )}
      </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1 flex justify-between">
            <span>Velocidade (mais rápido pode deixar a conversa natural, como nós falamos normalmente)</span>
            <span className="text-gray-500 dark:text-neutral-400">{rate.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            disabled={!canEdit}
            className="w-full accent-emerald-600 dark:accent-emerald-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}


        {canEdit && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}