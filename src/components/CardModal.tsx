import React, { useState, useEffect, useRef } from 'react';


import type { Card, Checklist, ChecklistItem, Priority, Board } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ConfirmModal from './ConfirmModal';

interface Props {
  card: Card;
  onClose: () => void;
  onSave: (updated: Card) => void;
  onDelete: () => void;
  boards?: Board[];
  onSendToBoard?: (cardTitle: string, itemText: string, boardId: string, columnId: string) => void;
  currentUserId?: string;
}

const PRIORITIES: { value: Priority; label: string; color: string; bg: string; glow: string }[] = [
  { value: 'baixa',  label: 'Baixa', color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  glow: 'rgba(74,222,128,0.35)' },
  { value: 'media',  label: 'Média', color: '#facc15', bg: 'rgba(250,204,21,0.15)',  glow: 'rgba(250,204,21,0.35)' },
  { value: 'alta',   label: 'Alta',  color: '#f87171', bg: 'rgba(248,113,113,0.15)', glow: 'rgba(248,113,113,0.35)' },
];

const ALERT_OPTIONS = [
  { value: 10,   label: '10 min' },
  { value: 15,   label: '15 min' },
  { value: 30,   label: '30 min' },
  { value: 60,   label: '1 hora' },
  { value: 120,  label: '2 horas' },
  { value: 480,  label: '8 horas' },
  { value: 1440, label: '1 dia' },
];

const COLORS = [
  { hex: '', label: 'Nenhuma' },
  { hex: '#f87171', label: 'Vermelho' },
  { hex: '#fb923c', label: 'Laranja' },
  { hex: '#facc15', label: 'Amarelo' },
  { hex: '#4ade80', label: 'Verde' },
  { hex: '#60a5fa', label: 'Azul' },
  { hex: '#c084fc', label: 'Roxo' },
  { hex: '#f472b6', label: 'Rosa' },
  { hex: '#94a3b8', label: 'Cinza' },
];

const CardModal: React.FC<Props> = ({ card, onClose, onSave, onDelete, boards, onSendToBoard, currentUserId }) => {
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState<Card>({ ...card, notifyByEmail: card.notifyByEmail ?? false, notifyEmailMinutes: card.notifyEmailMinutes ?? null, notifyEmailUserId: card.notifyEmailUserId ?? currentUserId ?? null, checklist: card.checklist.map(cl => ({ ...cl, items: [...cl.items] })), comments: [...card.comments] });
  const [descMaximized, setDescMaximized] = useState(false);
  const [newCheckItems, setNewCheckItems] = useState<Record<string, string>>({});
  const [newChecklistName, setNewChecklistName] = useState('');
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendItem, setSendItem] = useState<ChecklistItem | null>(null);
  const [sendBoardId, setSendBoardId] = useState('');
  const [sendColId, setSendColId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sempre sincroniza o draft com o card do backend ao abrir ou quando o card mudar
  useEffect(() => {
    setDraft({ ...card, notifyByEmail: card.notifyByEmail ?? false, notifyEmailMinutes: card.notifyEmailMinutes ?? null, notifyEmailUserId: card.notifyEmailUserId ?? currentUserId ?? null, checklist: card.checklist.map(cl => ({ ...cl, items: [...cl.items] })), comments: [...card.comments] });
  }, [card]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { onSave(draft); onClose(); } };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [draft, onClose, onSave]);

  const update = (partial: Partial<Card>) => setDraft(d => ({ ...d, ...partial }));

  const addCheckItem = (clId: string, text: string) => {
    if (!text.trim()) return;
    update({ checklist: draft.checklist.map((cl: Checklist) => cl.id === clId ? { ...cl, items: [...cl.items, { id: uuidv4(), text: text.trim(), done: false }] } : cl) });
    setNewCheckItems(prev => ({ ...prev, [clId]: '' }));
  };

  const toggleCheck = (clId: string, itemId: string) =>
    update({ checklist: draft.checklist.map((cl: Checklist) => cl.id === clId ? { ...cl, items: cl.items.map((i: ChecklistItem) => i.id === itemId ? { ...i, done: !i.done } : i) } : cl) });

  const deleteCheck = (clId: string, itemId: string) =>
    update({ checklist: draft.checklist.map((cl: Checklist) => cl.id === clId ? { ...cl, items: cl.items.filter((i: ChecklistItem) => i.id !== itemId) } : cl) });

  const updateCheckText = (clId: string, itemId: string, text: string) =>
    update({ checklist: draft.checklist.map((cl: Checklist) => cl.id === clId ? { ...cl, items: cl.items.map((i: ChecklistItem) => i.id === itemId ? { ...i, text } : i) } : cl) });

  const addComment = () => {
    const text = newComment.trim();
    if (!text) return;
    update({ comments: [...draft.comments, { id: uuidv4(), text, createdAt: new Date().toISOString() }] });
    setNewComment('');
  };

  const deleteComment = (id: string) =>
    update({ comments: draft.comments.filter(c => c.id !== id) });

  const allItems = draft.checklist.flatMap((cl: Checklist) => cl.items);
  const doneCount = allItems.filter((i: ChecklistItem) => i.done).length;
  const totalCount = allItems.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) { onSave(draft); onClose(); } }}
      >
        <div
          className="card-modal-box w-full max-w-[72rem] max-h-[98vh] overflow-y-auto overflow-x-auto flex flex-col rounded-xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-modal)',
            width: '110%', // Força largura extra além do max-w
            minWidth: '900px',
            height: '92vh',
            minHeight: '700px',
          }}
        >
          {/* Accent top bar */}
          {draft.color && (
            <div className="h-0.5 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${draft.color}, transparent 70%)` }} />
          )}
          <div className="card-modal-content p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <textarea
                value={draft.title}
                onChange={e => update({ title: e.target.value })}
                className="flex-1 text-base font-semibold resize-none rounded-lg px-2 py-1 outline-none"
                style={{ ...inputStyle, border: '1px solid transparent', background: 'transparent', color: 'var(--text-primary)' }}
                rows={2}
                placeholder="Título do cartão"
              />
              <button
                onClick={() => { onSave(draft); onClose(); }}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
                style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                ✕
              </button>
            </div>

            {/* Top: Descrição + Comentários lado a lado */}
            <div className="flex flex-row gap-6 w-full">
              {/* Descrição */}
              <div className="flex-1 flex flex-col gap-2 min-w-[260px]">
                <div className="flex items-center justify-between mb-1">
                  <Label>Descrição</Label>
                  <button
                    type="button"
                    onClick={() => setDescMaximized(m => !m)}
                    className="text-xs px-2 py-1 rounded transition-all"
                    style={{ color: 'var(--accent)', background: 'var(--accent-faint)', border: '1px solid var(--accent-border)' }}
                    title={descMaximized ? 'Minimizar descrição' : 'Maximizar descrição'}
                  >
                    {descMaximized ? 'Minimizar' : 'Maximizar'}
                  </button>
                </div>
                <div className="flex gap-2 mb-2">
                  <button type="button" title="Negrito" className="px-2 py-1 rounded text-sm font-bold border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all"
                    onClick={() => {
                      const textarea = descRef.current;
                      if (!textarea) return;
                      const { selectionStart, selectionEnd } = textarea;
                      const start = draft.description.slice(0, selectionStart);
                      const end = draft.description.slice(selectionEnd);
                      const selected = draft.description.slice(selectionStart, selectionEnd);
                      update({ description: `${start}**${selected || 'Texto em negrito'}**${end}` });
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start.length + 2, start.length + 2 + (selected ? selected.length : 14));
                      }, 0);
                    }}
                  >B</button>
                  <button type="button" title="Lista ordenada" className="px-2 py-1 rounded text-sm border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all"
                    onClick={() => {
                      const lines = draft.description.split('\n');
                      update({ description: lines.map((l, i) => l ? `${i + 1}. ${l}` : '').join('\n') });
                    }}
                  >1.</button>
                  <button type="button" title="Lista desordenada" className="px-2 py-1 rounded text-sm border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all"
                    onClick={() => {
                      const lines = draft.description.split('\n');
                      update({ description: lines.map(l => l ? `- ${l}` : '').join('\n') });
                    }}
                  >•</button>
                </div>
                <textarea
                  ref={descRef}
                  value={draft.description}
                  onChange={e => update({ description: e.target.value })}
                  className="w-full rounded-lg p-3 text-sm outline-none"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    minHeight: descMaximized ? 800 : 420,
                    maxHeight: descMaximized ? 1200 : 600,
                    resize: descMaximized ? 'vertical' : 'none',
                    color: 'var(--text-primary)',
                    transition: 'max-height 0.2s',
                  }}
                  rows={descMaximized ? 40 : 20}
                  placeholder="Adicione uma descrição detalhada..."
                />
              </div>
              {/* Comentários */}
              <div className="flex-1 flex flex-col gap-2 min-w-[260px] max-w-[340px]">
                <Label>💬 Comentários ({draft.comments.length})</Label>
                {draft.comments.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
                    {[...draft.comments].reverse().map(comment => (
                      <div key={comment.id} className="group rounded-lg p-2.5 transition-colors" style={{ background: 'var(--row-bg)' }}>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs transition-all w-4 h-4 flex items-center justify-center"
                            style={{ color: 'rgba(248,113,113,0.6)' }}
                            title="Deletar comentário"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-xs leading-snug" style={{ color: 'var(--text-body)' }}>
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addComment(); }}
                    placeholder="Adicionar comentário..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  />
                  <button
                    onClick={addComment}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-faint)')}
                  >
                    ✓
                  </button>
                </div>
              </div>
            </div>

            {/* Restante dos campos abaixo */}
            <div className="mt-6 flex flex-col gap-4">
              {/* Cor, Prioridade, Vencimento e Alerta na mesma linha */}
              <div className="flex flex-row gap-6 w-full items-end flex-wrap">
                {/* Cor de destaque */}
                <div className="flex flex-col min-w-[180px] flex-1">
                  <Label>Cor de destaque</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {COLORS.map(c => (
                      <button
                        key={c.hex}
                        title={c.label}
                        onClick={() => update({ color: c.hex })}
                        className="relative w-7 h-7 rounded-full transition-all hover:scale-110"
                        style={{
                          backgroundColor: c.hex || 'var(--glass-md)',
                          border: draft.color === c.hex ? '2px solid var(--accent)' : '2px solid var(--glass-md)',
                          boxShadow: draft.color === c.hex && c.hex ? `0 0 8px ${c.hex}60` : 'none',
                          transform: draft.color === c.hex ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* Prioridade */}
                <div className="flex flex-col min-w-[180px] flex-1">
                  <Label>Prioridade</Label>
                  <div className="flex gap-2 mt-1">
                    {PRIORITIES.map(p => {
                      const selected = draft.priority === p.value;
                      return (
                        <button
                          key={p.value}
                          onClick={() => update({ priority: selected ? '' : p.value })}
                          className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background: selected ? p.bg : 'var(--bg-input)',
                            border: selected ? `1px solid ${p.color}` : '1px solid var(--border)',
                            color: selected ? p.color : 'var(--text-muted)',
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Vencimento */}
                <div className="flex flex-col min-w-[180px] flex-1">
                  <Label>📅 Vencimento</Label>
                  <input
                    type="datetime-local"
                    value={draft.dueDate}
                    onChange={e => update({ dueDate: e.target.value })}
                    className="rounded-lg px-3 py-2 text-sm outline-none mt-1"
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                {/* Alerta */}
                <div className="flex flex-col min-w-[140px] flex-1">
                  <Label>🔔 Avisar (min antes)</Label>
                  <select
                    value={draft.alertMinutes}
                    onChange={e => update({ alertMinutes: Number(e.target.value) })}
                    className="rounded-lg px-3 py-2 text-sm outline-none mt-1"
                    style={{ ...inputStyle, colorScheme: 'var(--color-scheme)' }}
                    disabled={!draft.dueDate}
                  >
                    {ALERT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {/* Notificação por email */}
                <div className="flex flex-col min-w-[220px] flex-1">
                  <Label>✉ Notificar por email</Label>
                  <label
                    className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer"
                    style={{ ...inputStyle }}
                  >
                    <input
                      type="checkbox"
                      checked={!!draft.notifyByEmail}
                      onChange={e => update({ notifyByEmail: e.target.checked, notifyEmailMinutes: e.target.checked ? (draft.notifyEmailMinutes ?? 1440) : null, notifyEmailUserId: e.target.checked ? (draft.notifyEmailUserId ?? currentUserId ?? null) : null })}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>Ativar alerta por email para este card</span>
                  </label>
                  {draft.notifyByEmail && (
                    <select
                      value={draft.notifyEmailMinutes ?? 1440}
                      onChange={e => update({ notifyEmailMinutes: Number(e.target.value) })}
                      className="rounded-lg px-3 py-2 text-sm outline-none mt-2"
                      style={{ ...inputStyle, colorScheme: 'var(--color-scheme)' }}
                    >
                      <option value={0}>No dia</option>
                      <option value={1440}>1 dia antes</option>
                      <option value={60}>1 hora antes</option>
                      <option value={30}>30 min antes</option>
                      <option value={10}>10 min antes</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Checklists */}
              <div className="flex items-center justify-between">
                <Label>☑ Checklists</Label>
                <div className="flex items-center gap-2">
                  {totalCount > 0 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {doneCount}/{totalCount} — {progress}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewChecklist(v => !v)}
                    className="text-xs px-2 py-1 rounded transition-all"
                    style={{ color: 'var(--accent)', background: 'var(--accent-faint)', border: '1px solid var(--accent-border)' }}
                  >
                    + Novo Checklist
                  </button>
                </div>
              </div>

              {/* New checklist name input */}
              {showNewChecklist && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistName}
                    onChange={e => setNewChecklistName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newChecklistName.trim()) {
                        update({ checklist: [...draft.checklist, { id: uuidv4(), title: newChecklistName.trim(), items: [] }] });
                        setNewChecklistName(''); setShowNewChecklist(false);
                      } else if (e.key === 'Escape') { setNewChecklistName(''); setShowNewChecklist(false); }
                    }}
                    placeholder="Nome do checklist..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (!newChecklistName.trim()) return;
                      update({ checklist: [...draft.checklist, { id: uuidv4(), title: newChecklistName.trim(), items: [] }] });
                      setNewChecklistName(''); setShowNewChecklist(false);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                  >
                    Criar
                  </button>
                  <button
                    onClick={() => { setNewChecklistName(''); setShowNewChecklist(false); }}
                    className="px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Each checklist */}
              {draft.checklist.map((cl: Checklist) => {
                const clDone = cl.items.filter((i: ChecklistItem) => i.done).length;
                const clTotal = cl.items.length;
                const clProgress = clTotal > 0 ? Math.round((clDone / clTotal) * 100) : 0;
                const clNewItem = newCheckItems[cl.id] ?? '';
                return (
                  <div key={cl.id} className="flex flex-col gap-2 rounded-xl p-3" style={{ background: 'var(--row-bg)', border: '1px solid var(--border)' }}>
                    {/* Checklist header */}
                    <div className="flex items-center gap-2 justify-between">
                      <input
                        type="text"
                        value={cl.title}
                        onChange={e => update({ checklist: draft.checklist.map((c: Checklist) => c.id === cl.id ? { ...c, title: e.target.value } : c) })}
                        className="flex-1 text-sm font-semibold bg-transparent outline-none"
                        style={{ color: 'var(--text-primary)' }}
                      />
                      <div className="flex items-center gap-1.5">
                        {clTotal > 0 && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{clDone}/{clTotal}</span>
                        )}
                        <button
                          onClick={() => update({ checklist: draft.checklist.filter((c: Checklist) => c.id !== cl.id) })}
                          className="text-xs w-5 h-5 flex items-center justify-center rounded transition-all"
                          style={{ color: 'rgba(248,113,113,0.6)' }}
                          title="Excluir checklist"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    {clTotal > 0 && (
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--track-bg)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${clProgress}%`, background: clProgress === 100 ? 'linear-gradient(90deg, #4ade80, #07d963)' : '#07d963' }}
                        />
                      </div>
                    )}
                    {/* Items */}
                    <div className="flex flex-col gap-1">
                      {cl.items.map((item: ChecklistItem) => (
                        <div key={item.id} className="flex items-center gap-2.5 group py-1 px-2 rounded-lg transition-colors" style={{ background: 'var(--bg-input)' }}>
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleCheck(cl.id, item.id)}
                            className="w-3.5 h-3.5 rounded cursor-pointer flex-shrink-0 accent-green-400"
                          />
                          <input
                            type="text"
                            value={item.text}
                            onChange={e => updateCheckText(cl.id, item.id, e.target.value)}
                            className="flex-1 text-sm bg-transparent outline-none transition-colors"
                            style={{ color: item.done ? 'var(--text-faint)' : 'var(--text-body)', textDecoration: item.done ? 'line-through' : 'none' }}
                          />
                          {boards && boards.length > 0 && onSendToBoard && (
                            <button
                              onClick={() => { setSendItem(item); setSendBoardId(''); setSendColId(''); }}
                              className="opacity-0 group-hover:opacity-100 text-xs transition-all w-4 h-4 flex items-center justify-center rounded"
                              style={{ color: '#60a5fa' }}
                              title="Criar cartão em outro quadro"
                            >↗</button>
                          )}
                          <button
                            onClick={() => deleteCheck(cl.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs transition-all w-4 h-4 flex items-center justify-center rounded"
                            style={{ color: '#f87171' }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                    {/* Add item to this checklist */}
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={clNewItem}
                        onChange={e => setNewCheckItems(prev => ({ ...prev, [cl.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') addCheckItem(cl.id, clNewItem); }}
                        placeholder="Novo item..."
                        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                        style={inputStyle}
                      />
                      <button
                        onClick={() => addCheckItem(cl.id, clNewItem)}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-faint)')}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 mt-2" style={{ borderTop: '1px solid var(--track-bg)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(card.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <div className="flex gap-2">
                {(!card.createdBy || card.createdBy === currentUserId) && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: '#f87171', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Excluir
                  </button>
                )}
                <button
                  onClick={() => { onSave(draft); onClose(); }}
                  className="text-sm px-4 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Tem certeza que deseja excluir?"
          confirmLabel="SIM"
          cancelLabel="NAO"
          onConfirm={() => { onDelete(); onClose(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Mini-modal: enviar item para outro quadro */}
      {sendItem && boards && onSendToBoard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-5 w-full max-w-sm mx-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-modal)' }}>
            <p className="text-xs font-medium tracking-widest mb-1" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>CRIAR CARTÃO EM</p>
            <p className="text-sm font-medium mb-4 truncate" style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>"{sendItem.text}"</p>
            {/* Seletor de quadro */}
            <div className="mb-3">
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Quadro</p>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {boards.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { setSendBoardId(b.id); setSendColId(''); }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all"
                    style={{
                      background: sendBoardId === b.id ? 'var(--accent-subtle)' : 'var(--row-bg)',
                      border: `1px solid ${sendBoardId === b.id ? 'var(--accent-glow-hover)' : 'var(--border)'}`,
                      color: sendBoardId === b.id ? 'var(--accent)' : 'var(--text-subtle)',
                    }}
                  >
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--accent-badge)', color: 'var(--accent)' }}>
                      {b.title.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{b.title}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Seletor de coluna — aparece após escolher quadro */}
            {sendBoardId && (() => {
              const targetBoard = boards.find(b => b.id === sendBoardId);
              if (!targetBoard || targetBoard.columns.length === 0) return (
                <p className="text-xs mb-4" style={{ color: '#f87171' }}>Este quadro não possui colunas.</p>
              );
              return (
                <div className="mb-4">
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Coluna</p>
                  <div className="flex flex-wrap gap-1.5">
                    {targetBoard.columns.map(col => (
                      <button
                        key={col.id}
                        onClick={() => setSendColId(col.id)}
                        className="px-3 py-1.5 rounded-lg text-xs transition-all"
                        style={{
                          background: sendColId === col.id ? (col.color ? `${col.color}22` : 'var(--accent-subtle)') : 'var(--glass-bg)',
                          border: `1px solid ${sendColId === col.id ? (col.color || 'var(--accent)') + '55' : 'var(--border)'}`,
                          color: sendColId === col.id ? (col.color || 'var(--accent)') : 'var(--text-subtle)',
                        }}
                      >
                        {col.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  if (sendBoardId && sendColId) {
                    onSendToBoard(card.title, sendItem.text, sendBoardId, sendColId);
                    setSendItem(null);
                  }
                }}
                disabled={!sendBoardId || !sendColId}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: sendBoardId && sendColId ? 'var(--accent)' : 'var(--accent-badge)',
                  color: sendBoardId && sendColId ? 'var(--text-on-accent)' : 'var(--accent)',
                  cursor: sendBoardId && sendColId ? 'pointer' : 'not-allowed',
                }}
              >
                Criar cartão
              </button>
              <button
                onClick={() => setSendItem(null)}
                className="flex-1 py-2 rounded-lg text-sm transition-all"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-xs font-medium tracking-widest" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
    {String(children).toUpperCase()}
  </span>
);

export default CardModal;
