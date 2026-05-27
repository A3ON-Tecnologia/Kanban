import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../types';

interface Props {
  card: CardType;
  columnId: string;
  onOpen: (cardId: string, columnId: string) => void;
  onDelete: (cardId: string, columnId: string) => void;
}

const COLOR_MAP: Record<string, { bar: string; glow: string }> = {
  '#f87171': { bar: '#f87171', glow: 'rgba(248,113,113,0.3)' },
  '#fb923c': { bar: '#fb923c', glow: 'rgba(251,146,60,0.3)' },
  '#facc15': { bar: '#facc15', glow: 'rgba(250,204,21,0.3)' },
  '#4ade80': { bar: '#4ade80', glow: 'rgba(74,222,128,0.3)' },
  '#60a5fa': { bar: '#60a5fa', glow: 'rgba(96,165,250,0.3)' },
  '#c084fc': { bar: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
  '#f472b6': { bar: '#f472b6', glow: 'rgba(244,114,182,0.3)' },
  '#94a3b8': { bar: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
};

const PRIORITY_MAP = {
  baixa: { label: 'Baixa', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)' },
  media: { label: 'Média', color: '#facc15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)' },
  alta:  { label: 'Alta',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
};

function formatDueDate(dueDate: string): { text: string; overdue: boolean } {
  if (!dueDate) return { text: '', overdue: false };
  const due = new Date(dueDate);
  const now = new Date();
  const overdue = due < now;
  const diffMs = due.getTime() - now.getTime();
  const diffH = diffMs / 3600000;

  let text: string;
  if (overdue) {
    const hoursAgo = Math.abs(diffH);
    text = hoursAgo < 24 ? `${Math.round(hoursAgo)}h atrás` : `${Math.round(hoursAgo / 24)}d atrás`;
  } else if (diffH < 1) {
    text = `${Math.round(diffH * 60)}min`;
  } else if (diffH < 24) {
    text = `${Math.round(diffH)}h`;
  } else {
    text = due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  return { text, overdue };
}

const KanbanCard: React.FC<Props> = ({ card, columnId, onOpen, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId },
  });

  const [hovered, setHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const doneCount = card.checklist.filter(i => i.done).length;
  const totalCount = card.checklist.length;
  const colorInfo = COLOR_MAP[card.color];
  const priorityInfo = card.priority ? PRIORITY_MAP[card.priority] : null;
  const due = card.dueDate ? formatDueDate(card.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        border: hovered
          ? `1px solid ${colorInfo ? colorInfo.bar : 'rgba(34,211,238,0.4)'}`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: hovered
          ? `0 0 18px ${colorInfo ? colorInfo.glow : 'rgba(34,211,238,0.12)'}, 0 4px 20px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.18s ease',
        transform: hovered && !isDragging ? `${CSS.Transform.toString(transform) || ''} translateY(-2px)` : CSS.Transform.toString(transform) || '',
      }}
      className="rounded-xl cursor-pointer select-none overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(card.id, columnId)}
    >
      {/* Color accent bar */}
      {card.color && (
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${colorInfo?.bar}, transparent)`, boxShadow: `0 0 8px ${colorInfo?.glow}` }} />
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div
            {...attributes}
            {...listeners}
            className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-medium leading-snug break-words" style={{ color: 'rgba(255,255,255,0.88)' }}>
              {card.title}
            </p>
          </div>
          {hovered && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(card.id, columnId); }}
              className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              title="Excluir cartão"
            >
              ✕
            </button>
          )}
        </div>

        {card.description && (
          <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {card.description}
          </p>
        )}

        {/* Priority + Due date badges */}
        {(priorityInfo || due) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {priorityInfo && (
              <span
                className="text-xs px-2 py-0.5 rounded-md mono font-medium"
                style={{ color: priorityInfo.color, background: priorityInfo.bg, border: `1px solid ${priorityInfo.border}`, fontSize: '10px' }}
              >
                {priorityInfo.label}
              </span>
            )}
            {due && (
              <span
                className="text-xs px-2 py-0.5 rounded-md mono flex items-center gap-1"
                style={{
                  color: due.overdue ? '#f87171' : 'rgba(255,255,255,0.4)',
                  background: due.overdue ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)',
                  border: due.overdue ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  fontSize: '10px',
                }}
              >
                <span>📅</span>
                <span>{due.text}</span>
              </span>
            )}
          </div>
        )}

        {totalCount > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(doneCount / totalCount) * 100}%`,
                  background: doneCount === totalCount
                    ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
                    : 'linear-gradient(90deg, #22d3ee, #8b5cf6)',
                }}
              />
            </div>
            <span className="text-xs mono" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
              {doneCount}/{totalCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
