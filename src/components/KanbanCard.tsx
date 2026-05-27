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

const COLOR_BAR: Record<string, string> = {
  '#f87171': '#f87171',
  '#fb923c': '#fb923c',
  '#facc15': '#facc15',
  '#4ade80': '#4ade80',
  '#60a5fa': '#60a5fa',
  '#c084fc': '#c084fc',
  '#f472b6': '#f472b6',
  '#94a3b8': '#94a3b8',
};

const PRIORITY_DOT: Record<string, string> = {
  baixa: '#4ade80',
  media: '#facc15',
  alta:  '#f87171',
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

  const colorBar = COLOR_BAR[card.color] || null;
  const priorityDot = card.priority ? PRIORITY_DOT[card.priority] : null;
  const due = card.dueDate ? formatDueDate(card.dueDate) : null;
  const doneCount = card.checklist.filter(i => i.done).length;
  const totalCount = card.checklist.length;

  // Build transform string — add rotate+scale when dragging
  const baseTransform = CSS.Transform.toString(transform);
  const cardTransform = isDragging && baseTransform
    ? `${baseTransform} rotate(1deg) scale(1.02)`
    : baseTransform ?? undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: cardTransform,
        transition: isDragging ? 'none' : transition,
        background: '#171a27',
        border: `1px solid ${isDragging ? 'rgba(7,217,99,0.5)' : hovered ? 'rgba(7,217,99,0.35)' : '#2b2e3a'}`,
        borderLeft: colorBar ? `3px solid ${colorBar}` : `3px solid ${isDragging ? 'rgba(7,217,99,0.5)' : '#2b2e3a'}`,
        boxShadow: isDragging
          ? '0 0 20px rgba(7,217,99,0.25), 0 8px 30px rgba(0,0,0,0.6)'
          : hovered ? '0 4px 20px rgba(0,0,0,0.45)' : '0 1px 4px rgba(0,0,0,0.35)',
        opacity: isDragging ? 0.9 : 1,
      }}
      className="rounded-xl cursor-pointer select-none overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(card.id, columnId)}
    >
      <div className="p-4 flex flex-col gap-2.5">
        {/* Header: title + priority dot */}
        <div className="flex items-start justify-between gap-2">
          <div
            {...attributes}
            {...listeners}
            className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
            onClick={() => onOpen(card.id, columnId)}
          >
            <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: '#e2e8f0' }}>
              {card.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {card.alertMinutes > 0 && (
              <span title="Alerta configurado" style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', flexShrink: 0 }} />
            )}
            {priorityDot && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityDot, display: 'inline-block', flexShrink: 0 }} />
            )}
            {hovered && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(card.id, columnId); }}
                className="w-5 h-5 rounded flex items-center justify-center text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}
                title="Excluir cartão"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#7a7f8c' }}>
            {card.description}
          </p>
        )}

        {/* Due date */}
        {due && (
          <div className="flex items-center gap-1" style={{ color: due.overdue ? '#f87171' : '#7a7f8c' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke={due.overdue ? '#f87171' : '#7a7f8c'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: '11px' }}>{due.text}</span>
          </div>
        )}

        {/* Checklist progress */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(doneCount / totalCount) * 100}%`,
                  background: doneCount === totalCount ? '#4ade80' : '#07d963',
                }}
              />
            </div>
            <span style={{ color: '#7a7f8c', fontSize: '10px' }}>{doneCount}/{totalCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
