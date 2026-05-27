import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import type { Column, Card } from '../types';
import KanbanCard from './KanbanCard';
import InlineEdit from './InlineEdit';

interface Props {
  column: Column;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onOpenCard: (cardId: string, columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

const KanbanColumn: React.FC<Props> = ({ column, onAddCard, onDeleteCard, onOpenCard, onRenameColumn, onDeleteColumn }) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({ id: `col-${column.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleAddCard = () => {
    const title = newCardTitle.trim();
    if (title) {
      onAddCard(column.id, title);
      setNewCardTitle('');
      setAddingCard(false);
    }
  };

  return (
    <div
      ref={setSortableRef}
      style={{
        ...style,
        background: 'rgba(8, 15, 35, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      className="flex-shrink-0 w-72 flex flex-col rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-1 min-w-0"
        >
          <InlineEdit
            value={column.title}
            onSave={v => onRenameColumn(column.id, v)}
            className="font-semibold text-sm block w-full tracking-wide"
            textColor="rgba(255,255,255,0.75)"
            tag="h3"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs mono px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,211,238,0.1)', color: 'rgba(34,211,238,0.7)', border: '1px solid rgba(34,211,238,0.15)' }}
          >
            {column.cards.length}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-base leading-none transition-all"
              style={{ color: 'rgba(255,255,255,0.25)', background: showMenu ? 'rgba(255,255,255,0.08)' : 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = showMenu ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)')}
            >
              ···
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-8 rounded-xl z-10 min-w-36 py-1 animate-slide-in"
                style={{ background: 'rgba(8,15,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              >
                <button
                  onClick={() => { onDeleteColumn(column.id); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: '#f87171' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Excluir coluna
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.2), transparent)' }} />

      {/* Cards */}
      <div ref={setDroppableRef} className="flex-1 px-3 py-3 flex flex-col gap-3 min-h-4">
        <SortableContext items={column.cards.map((c: Card) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card: Card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              onOpen={onOpenCard}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      {addingCard ? (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
              if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
            }}
            placeholder="Título do cartão..."
            className="w-full rounded-xl p-2.5 text-sm resize-none outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(34,211,238,0.3)',
              color: 'rgba(255,255,255,0.85)',
            }}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="flex-1 text-sm py-1.5 rounded-lg font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', color: '#050b18' }}
            >
              Adicionar
            </button>
            <button
              onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
              className="text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCard(true)}
          className="mx-3 mb-3 flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-all"
          style={{ color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.08)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(34,211,238,0.7)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)'; e.currentTarget.style.background = 'rgba(34,211,238,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span className="text-base leading-none">+</span>
          <span>Adicionar cartão</span>
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
