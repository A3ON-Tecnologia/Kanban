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
  baixa: { label: 'Baixa',  color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.35)' },
  media: { label: 'Média',  color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.35)' },
  alta:  { label: 'Alta',   color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)' },
};

function formatDueDate(dueDate: string): { text: string; overdue: boolean } {
  if (!dueDate) return { text: '', overdue: false };
  const due = new Date(dueDate);
  const now = new Date();
  const overdue = due < now;
  const day   = String(due.getDate()).padStart(2, '0');
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const hour  = String(due.getHours()).padStart(2, '0');
  const min   = String(due.getMinutes()).padStart(2, '0');
  return { text: `${day}/${month} ${hour}:${min}`, overdue };
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
        background: 'rgba(18, 27, 52, 0.97)',
        backdropFilter: 'blur(16px)',
        border: hovered
          ? `1px solid ${colorInfo ? colorInfo.bar : 'rgba(34,211,238,0.35)'}`
          : '1px solid rgba(255,255,255,0.09)',
        borderLeft: colorInfo
          ? `3px solid ${colorInfo.bar}`
          : '3px solid rgba(255,255,255,0.12)',
        boxShadow: hovered
          ? `0 4px 24px rgba(0,0,0,0.6), 0 0 16px ${colorInfo ? colorInfo.glow : 'rgba(34,211,238,0.08)'}`
          : '0 2px 12px rgba(0,0,0,0.45)',
        transition: 'all 0.18s ease',
        transform: hovered && !isDragging
          ? `${CSS.Transform.toString(transform) || ''} translateY(-3px)`
          : CSS.Transform.toString(transform) || '',
      }}
      className="rounded-2xl cursor-pointer select-none overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(card.id, columnId)}
    >
      <div className="p-4 flex flex-col gap-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div
            {...attributes}
            {...listeners}
            className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold leading-snug break-words" style={{ color: 'rgba(255,255,255,0.93)' }}>
              {card.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Alert dot */}
            {card.alertMinutes > 0 && (
              <span
                title="Alerta configurado"
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#fbbf24',
                  boxShadow: '0 0 6px rgba(251,191,36,0.7)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
            {hovered && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(card.id, columnId); }}
                className="w-5 h-5 rounded flex items-center justify-center text-xs transition-all"
                style={{ color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                title="Excluir cartão"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Priority badge */}
        {priorityInfo && (
          <div>
            <span
              className="inline-block text-xs px-2.5 py-0.5 rounded-lg font-medium"
              style={{
                color: priorityInfo.color,
                background: priorityInfo.bg,
                border: `1px solid ${priorityInfo.border}`,
                fontSize: '11px',
              }}
            >
              {priorityInfo.label}
            </span>
          </div>
        )}

        {/* Description */}
        {card.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {card.description}
          </p>
        )}

        {/* Checklist progress */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2 mt-1">
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
            <span className="mono" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
              {doneCount}/{totalCount}
            </span>
          </div>
        )}

        {/* Due date at bottom */}
        {due && (
          <div className="flex items-center gap-1.5 pt-1 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={due.overdue ? '#f87171' : 'rgba(255,255,255,0.3)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span
              className="mono"
              style={{
                fontSize: '11px',
                color: due.overdue ? '#f87171' : 'rgba(255,255,255,0.35)',
              }}
            >
              {due.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
