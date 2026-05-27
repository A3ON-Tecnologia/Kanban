import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import type { Column, Card } from '../types';
import KanbanCard from './KanbanCard';
import InlineEdit from './InlineEdit';

interface Props {
  column: Column;
  index: number;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onOpenCard: (cardId: string, columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRecolorColumn: (columnId: string, color: string, color2: string) => void;
}

const COLUMN_ACCENT = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#ffffff'];

const KanbanColumn: React.FC<Props> = ({ column, index, onAddCard, onDeleteCard, onOpenCard, onRenameColumn, onDeleteColumn, onRecolorColumn }) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const accent = column.color || COLUMN_ACCENT[index % COLUMN_ACCENT.length];
  const accent2 = column.color2 || accent;

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
        background: '#1b1e2f',
        border: '1px solid #2b2e3a',
      }}
      className="flex-shrink-0 w-[300px] flex flex-col rounded-xl"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 gap-2 rounded-t-xl"
        style={{
          background: `linear-gradient(to right, ${accent}55, ${accent2}30)`,
          borderBottom: `1px solid ${accent}40`,
        }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex-shrink-0 flex flex-col gap-0.5 px-0.5 py-1 rounded opacity-40 hover:opacity-80 transition-opacity"
            title="Arrastar coluna"
          >
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff', display: 'block' }} />
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff', display: 'block' }} />
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff', display: 'block' }} />
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff', display: 'block' }} />
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff', display: 'block' }} />
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff', display: 'block' }} />
            </span>
          </div>
          <InlineEdit
            value={column.title}
            onSave={v => onRenameColumn(column.id, v)}
            className="font-semibold text-sm block w-full"
            textColor="#ffffff"
            tag="h3"
          />
          <span
            className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#7a7f8c', fontSize: '10px' }}
          >
            {column.cards.length}
          </span>
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-6 h-6 rounded flex items-center justify-center text-base leading-none transition-colors"
            style={{ color: showMenu ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = showMenu ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)')}
          >
            ···
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-7 rounded-lg z-10 py-1"
              style={{ background: '#1f2235', border: '1px solid #2b2e3a', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', minWidth: 160 }}
            >
              <button
                onClick={() => setShowColorPicker(p => !p)}
                className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
                style={{ color: '#e2e8f0' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: accent, display: 'inline-block', flexShrink: 0 }} />
                Mudar cor
              </button>
              {showColorPicker && (
                <div className="flex flex-col gap-2 px-3 pb-2 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <span style={{ fontSize: 10, color: '#7a7f8c' }}>Início</span>
                    <div className="flex flex-wrap gap-1.5">
                      {COLUMN_ACCENT.map(c => (
                        <button key={c}
                          onClick={() => onRecolorColumn(column.id, c, column.color2 || accent2)}
                          className="w-5 h-5 rounded-full flex-shrink-0 transition-transform"
                          style={{ background: c, outline: accent === c ? `2px solid ${c === '#ffffff' ? '#aaa' : c}` : 'none', outlineOffset: 2, transform: accent === c ? 'scale(1.2)' : 'scale(1)', border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span style={{ fontSize: 10, color: '#7a7f8c' }}>Fim</span>
                    <div className="flex flex-wrap gap-1.5">
                      {COLUMN_ACCENT.map(c => (
                        <button key={c}
                          onClick={() => onRecolorColumn(column.id, column.color || accent, c)}
                          className="w-5 h-5 rounded-full flex-shrink-0 transition-transform"
                          style={{ background: c, outline: accent2 === c ? `2px solid ${c === '#ffffff' ? '#aaa' : c}` : 'none', outlineOffset: 2, transform: accent2 === c ? 'scale(1.2)' : 'scale(1)', border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: `linear-gradient(to right, ${accent}, ${accent2})` }} />
                </div>
              )}
              <button
                onClick={() => { onDeleteColumn(column.id); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{ color: '#f87171' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Excluir coluna
              </button>
            </div>
          )}
        </div>
      </div>

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
            className="w-full rounded-lg p-2.5 text-sm resize-none outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #2b2e3a',
              color: '#e2e8f0',
            }}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="flex-1 text-sm py-1.5 rounded-lg font-semibold transition-colors"
              style={{ background: accent, color: '#0f1117' }}
            >
              Adicionar
            </button>
            <button
              onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
              className="text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(148,163,184,0.5)' }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCard(true)}
          className="mx-3 mb-3 flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg transition-all"
          style={{ color: 'rgba(148,163,184,0.4)', border: '1px dashed #2b2e3a' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; e.currentTarget.style.borderColor = 'rgba(7,217,99,0.3)'; e.currentTarget.style.background = 'rgba(7,217,99,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.4)'; e.currentTarget.style.borderColor = '#2b2e3a'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span className="text-base leading-none">+</span>
          <span>Adicionar cartão</span>
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
