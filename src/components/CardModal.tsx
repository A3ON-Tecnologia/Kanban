import React, { useState, useEffect } from 'react';
import type { Card, ChecklistItem, Priority } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  card: Card;
  onClose: () => void;
  onSave: (updated: Card) => void;
  onDelete: () => void;
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

const CardModal: React.FC<Props> = ({ card, onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useState<Card>({ ...card, checklist: [...card.checklist], comments: [...card.comments] });
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { onSave(draft); onClose(); } };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [draft, onClose, onSave]);

  const update = (partial: Partial<Card>) => setDraft(d => ({ ...d, ...partial }));

  const addCheckItem = () => {
    const text = newCheckItem.trim();
    if (!text) return;
    update({ checklist: [...draft.checklist, { id: uuidv4(), text, done: false }] });
    setNewCheckItem('');
  };

  const toggleCheck = (id: string) =>
    update({ checklist: draft.checklist.map((i: ChecklistItem) => i.id === id ? { ...i, done: !i.done } : i) });

  const deleteCheck = (id: string) =>
    update({ checklist: draft.checklist.filter((i: ChecklistItem) => i.id !== id) });

  const updateCheckText = (id: string, text: string) =>
    update({ checklist: draft.checklist.map((i: ChecklistItem) => i.id === id ? { ...i, text } : i) });

  const addComment = () => {
    const text = newComment.trim();
    if (!text) return;
    update({ comments: [...draft.comments, { id: uuidv4(), text, createdAt: new Date().toISOString() }] });
    setNewComment('');
  };

  const deleteComment = (id: string) =>
    update({ comments: draft.comments.filter(c => c.id !== id) });

  const doneCount = draft.checklist.filter((i: ChecklistItem) => i.done).length;
  const totalCount = draft.checklist.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.85)',
    outline: 'none',
  };

  const focusStyle = 'focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) { onSave(draft); onClose(); } }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col rounded-2xl animate-slide-in"
        style={{
          background: 'rgba(8, 15, 40, 0.97)',
          border: '1px solid rgba(34,211,238,0.2)',
          boxShadow: '0 0 60px rgba(34,211,238,0.08), 0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Accent top bar */}
        {draft.color && (
          <div className="h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${draft.color}, transparent 70%)`, boxShadow: `0 0 12px ${draft.color}` }} />
        )}

        <div className="p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <textarea
              value={draft.title}
              onChange={e => update({ title: e.target.value })}
              className={`flex-1 text-lg font-bold resize-none rounded-lg px-2 py-1 ${focusStyle}`}
              style={{ ...inputStyle, border: '1px solid transparent', background: 'transparent' }}
              rows={2}
              placeholder="Título do cartão"
            />
            <button
              onClick={() => { onSave(draft); onClose(); }}
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              ✕
            </button>
          </div>

          {/* Label */}
          <Label>Descrição</Label>
          <textarea
            value={draft.description}
            onChange={e => update({ description: e.target.value })}
            className={`w-full rounded-xl p-3 text-sm resize-none ${focusStyle}`}
            style={inputStyle}
            rows={3}
            placeholder="Adicione uma descrição detalhada..."
          />

          {/* Color picker */}
          <Label>Cor de destaque</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c.hex}
                title={c.label}
                onClick={() => update({ color: c.hex })}
                className="relative w-7 h-7 rounded-full transition-all hover:scale-110"
                style={{
                  backgroundColor: c.hex || 'rgba(255,255,255,0.1)',
                  border: draft.color === c.hex ? '2px solid #22d3ee' : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: draft.color === c.hex && c.hex ? `0 0 10px ${c.hex}` : 'none',
                  transform: draft.color === c.hex ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Priority */}
          <Label>Prioridade</Label>
          <div className="flex gap-2">
            {PRIORITIES.map(p => {
              const selected = draft.priority === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => update({ priority: selected ? '' : p.value })}
                  className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: selected ? p.bg : 'rgba(255,255,255,0.04)',
                    border: selected ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.1)',
                    color: selected ? p.color : 'rgba(255,255,255,0.45)',
                    boxShadow: selected ? `0 0 10px ${p.glow}` : 'none',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Due date + alert */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label>📅 Vencimento</Label>
              <input
                type="datetime-local"
                value={draft.dueDate}
                onChange={e => update({ dueDate: e.target.value })}
                className={`w-full rounded-lg px-3 py-2 text-sm ${focusStyle}`}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
            <div className="flex flex-col gap-1.5" style={{ minWidth: '130px' }}>
              <Label>🔔 Avisar (min antes)</Label>
              <select
                value={draft.alertMinutes}
                onChange={e => update({ alertMinutes: Number(e.target.value) })}
                className={`w-full rounded-lg px-3 py-2 text-sm ${focusStyle}`}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                disabled={!draft.dueDate}
              >
                {ALERT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist */}
          <div className="flex items-center justify-between">
            <Label>Checklist</Label>
            {totalCount > 0 && (
              <span className="text-xs mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {doneCount}/{totalCount} — {progress}%
              </span>
            )}
          </div>

          {totalCount > 0 && (
            <div className="h-1 rounded-full overflow-hidden -mt-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: progress === 100
                    ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
                    : 'linear-gradient(90deg, #22d3ee, #8b5cf6)',
                  boxShadow: progress === 100 ? '0 0 8px rgba(74,222,128,0.5)' : '0 0 8px rgba(34,211,238,0.3)',
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {draft.checklist.map((item: ChecklistItem) => (
              <div key={item.id} className="flex items-center gap-2.5 group py-1 px-2 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleCheck(item.id)}
                  className="w-3.5 h-3.5 rounded cursor-pointer flex-shrink-0 accent-cyan-400"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={e => updateCheckText(item.id, e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none transition-colors"
                  style={{
                    color: item.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}
                />
                <button
                  onClick={() => deleteCheck(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs transition-all w-4 h-4 flex items-center justify-center rounded"
                  style={{ color: '#f87171' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCheckItem}
              onChange={e => setNewCheckItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCheckItem(); }}
              placeholder="Novo item..."
              className={`flex-1 rounded-lg px-3 py-2 text-sm ${focusStyle}`}
              style={inputStyle}
            />
            <button
              onClick={addCheckItem}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,211,238,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,211,238,0.1)')}
            >
              + Add
            </button>
          </div>

          {/* Comentários */}
          <div>
            <Label>💬 Comentários ({draft.comments.length})</Label>
          </div>

          {draft.comments.length > 0 && (
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
              {draft.comments.map(comment => (
                <div key={comment.id} className="group rounded-lg p-2.5 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-xs mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                  <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
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
              className={`flex-1 rounded-lg px-3 py-2 text-sm ${focusStyle}`}
              style={inputStyle}
            />
            <button
              onClick={addComment}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,211,238,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,211,238,0.1)')}
            >
              ✓
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {new Date(card.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="text-sm px-3 py-1.5 rounded-lg transition-all"
                style={{ color: '#f87171', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Excluir
              </button>
              <button
                onClick={() => { onSave(draft); onClose(); }}
                className="text-sm px-4 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', color: '#050b18' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-xs font-semibold mono tracking-widest" style={{ color: 'rgba(34,211,238,0.5)', fontSize: '10px' }}>
    {String(children).toUpperCase()}
  </span>
);

export default CardModal;
