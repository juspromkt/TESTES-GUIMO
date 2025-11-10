// src/components/configuracoes/TagsSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, MoreVertical, Edit3, Copy, Trash2, Users as UsersIcon,
  GripVertical, Loader2, AlertTriangle,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { Tag } from "../../types/tag";
import Modal from "../Modal";

interface TagsSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

const DESC_KEY = "guimoo_tag_desc_v1";
type DescMap = Record<string, string>;

function readDescMap(): DescMap {
  try {
    const raw = localStorage.getItem(DESC_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeDescMap(map: DescMap) {
  try {
    localStorage.setItem(DESC_KEY, JSON.stringify(map));
  } catch {}
}

export default function TagsSection({ isActive, canEdit }: TagsSectionProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [descMap, setDescMap] = useState<DescMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagCounts, setTagCounts] = useState<Record<number, number>>({});

  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCor, setFormCor] = useState("#000000");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    setDescMap(readDescMap());
    Promise.all([fetchTags(), fetchTagCounts()])
      .catch(() => setError("Erro ao carregar etiquetas"))
      .finally(() => setLoading(false));
  }, [isActive]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-tag-actions]")) setOpenMenuId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // 🔹 Busca lista de tags
  const fetchTags = async () => {
    try {
      const res = await fetch("https://n8n.lumendigital.com.br/webhook/prospecta/tag/list", {
        headers: { token },
      });
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch {
      setError("Erro ao carregar etiquetas");
    }
  };

  // 🔹 Busca contagem de tags igual ao CRM
  const fetchTagCounts = async () => {
    try {
      const [tagsRes, assocRes] = await Promise.all([
        fetch("https://n8n.lumendigital.com.br/webhook/prospecta/tag/list", {
          headers: { token },
        }),
        fetch("https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/list", {
          headers: { token },
        }),
      ]);

      const tagsData = tagsRes.ok ? await tagsRes.json() : [];
      const assocData = assocRes.ok ? await assocRes.json() : [];

      const tagsList = Array.isArray(tagsData) ? tagsData : [];
      setTags(tagsList);

      const counts: Record<number, number> = {};
      const associations = Array.isArray(assocData) ? assocData : [];

      associations.forEach((rel: { id_negociacao: number | number[]; id_tag: number }) => {
        const negociacaoIds = Array.isArray(rel.id_negociacao)
          ? rel.id_negociacao
          : [rel.id_negociacao];
        const tagId = rel.id_tag;
        if (tagId) {
          counts[tagId] = (counts[tagId] || 0) + negociacaoIds.length;
        }
      });

      setTagCounts(counts);
    } catch (err) {
      console.error("Erro ao buscar contagem de tags:", err);
      setTagCounts({});
    }
  };

  const setTagDescription = (id: number, desc: string) => {
    const next = { ...descMap };
    if (desc.trim()) next[id] = desc;
    else delete next[id];
    setDescMap(next);
    writeDescMap(next);
  };

  const handleCreateEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingTag;
      const endpoint = isEdit
        ? "https://n8n.lumendigital.com.br/webhook/prospecta/tag/update"
        : "https://n8n.lumendigital.com.br/webhook/prospecta/tag/create";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { Id: editingTag!.Id, nome: formNome, cor: formCor, cor_texto: "#fff" }
        : { nome: formNome, cor: formCor, cor_texto: "#fff" };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao salvar etiqueta");

      await Promise.all([fetchTags(), fetchTagCounts()]);
      if (isEdit) setTagDescription(editingTag!.Id, formDescricao);
      setIsFormOpen(false);
    } catch {
      setError("Erro ao salvar etiqueta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (tag: Tag) => {
    try {
      const res = await fetch("https://n8n.lumendigital.com.br/webhook/prospecta/tag/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({
          nome: `${tag.nome} (cópia)`,
          cor: tag.cor,
          cor_texto: tag.cor_texto,
        }),
      });
      if (!res.ok) throw new Error();
      await Promise.all([fetchTags(), fetchTagCounts()]);
    } catch {
      setError("Erro ao duplicar etiqueta");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/tag/delete?id=${deleteTarget.Id}`,
        {
          method: "DELETE",
          headers: { token },
        }
      );
      const next = { ...descMap };
      delete next[deleteTarget.Id];
      writeDescMap(next);
      setDescMap(next);
      await Promise.all([fetchTags(), fetchTagCounts()]);
      setDeleteTarget(null);
    } catch {
      setError("Erro ao excluir etiqueta");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter(
      (t) =>
        t.nome.toLowerCase().includes(q) ||
        (descMap[t.Id]?.toLowerCase().includes(q) ?? false)
    );
  }, [tags, query, descMap]);

  if (!isActive) return null;

  /* Portal do menu de ações */
  const menuPortal =
    openMenuId !== null && menuPosition
      ? createPortal(
          <div
            className="fixed z-[9999] w-44 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl"
            style={{ left: menuPosition.x, top: menuPosition.y }}
          >
            <button
              onClick={() => {
                setOpenMenuId(null);
                const t = tags.find((t) => t.Id === openMenuId);
                if (t) {
                  setEditingTag(t);
                  setFormNome(t.nome);
                  setFormDescricao(descMap[t.Id] || "");
                  setFormCor(t.cor);
                  setIsFormOpen(true);
                }
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              <Edit3 className="h-4 w-4" /> Editar
            </button>
            <button
              onClick={() => {
                setOpenMenuId(null);
                const t = tags.find((t) => t.Id === openMenuId);
                if (t) handleDuplicate(t);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              <Copy className="h-4 w-4" /> Duplicar
            </button>
            <button
              onClick={() => {
                setOpenMenuId(null);
                const t = tags.find((t) => t.Id === openMenuId);
                if (t) setDeleteTarget(t);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Etiquetas</h2>

          {/* Tooltip detalhada do código 1 */}
          <div className="relative group">
            <button
              className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              ?
            </button>
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-3 bg-gray-900 dark:bg-neutral-900 text-white dark:text-neutral-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10 border border-gray-700 dark:border-neutral-700">
              As <strong>etiquetas</strong> servem para organizar e acompanhar os leads dentro do sistema. Durante o atendimento a IA ou a equipe podem atribuir ou remover etiquetas automaticamente, conforme as ações do lead. <strong>O recomendado é que use o STATUS DO LEAD como principal controle</strong>, e as Etiquetas como um apoio visual e organizacional.
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setEditingTag(null);
              setFormNome("");
              setFormDescricao("");
              setFormCor("#000000");
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg px-4 py-2 hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus size={18} /> Criar Etiqueta
          </button>
        )}
      </div>

      <div className="relative mb-4 max-w-lg">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar etiquetas..."
          className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-neutral-900 text-xs uppercase text-gray-500 dark:text-neutral-400">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Descrição</th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <UsersIcon size={14} /> Contatos
                  </div>
                </th>
                <th className="w-16 px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700 text-sm">
              {filtered.map((t) => (
                <tr key={t.Id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                  <td className="px-4 py-3 text-gray-400 dark:text-neutral-500">
                    <GripVertical className="h-4 w-4" />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: t.cor, color: "#fff" }}
                    >
                      {t.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {descMap[t.Id] ? (
                      <span className="text-gray-700 dark:text-neutral-300">{descMap[t.Id]}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
                    {tagCounts[t.Id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right relative" data-tag-actions>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setOpenMenuId(openMenuId === t.Id ? null : t.Id);
                        setMenuPosition({
                          x: rect.right - 160,
                          y: rect.bottom + window.scrollY,
                        });
                      }}
                      className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-600 dark:text-neutral-400" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-neutral-400">
                    Nenhuma etiqueta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔹 Modal de criação/edição */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={`${editingTag ? "Editar" : "Criar"} Etiqueta`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Nome
            </label>
            <input
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 px-3 py-2 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Descrição
            </label>
            <textarea
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 px-3 py-2 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Cor
            </label>
            <ColorGrid value={formCor} onChange={setFormCor} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-md border border-gray-300 dark:border-neutral-600 px-4 py-2 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 dark:bg-blue-700 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60"
            >
              {submitting ? "Salvando..." : editingTag ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 🔹 Modal de exclusão */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir etiqueta"
        maxWidth="sm"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 dark:bg-red-950 p-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-gray-700 dark:text-neutral-300">
            Deseja realmente excluir <strong>{deleteTarget?.nome}</strong>?
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-md border border-gray-300 dark:border-neutral-600 px-4 py-2 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 dark:bg-red-700 px-4 py-2 text-white hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-60"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </Modal>

      {menuPortal}
    </div>
  );
}

/* ------------------------------- Paleta de cores ------------------------------ */
const COLORS = [
  "#000000", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db",
  "#dc2626", "#ea580c", "#f59e0b", "#84cc16", "#22c55e",
  "#0ea5e9", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

function ColorGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-7 w-7 rounded-md border ${
            value === c ? "ring-2 ring-blue-500" : ""
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
