import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import type { Board, Card, Column } from '../types';
import { saveBoard as saveBoardAPI, recordDeletedCard, loadDeletedCards, restoreDeletedCard, removeDeletedCard, type DeletedCardRecord } from '../api';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import CardModal from './CardModal';
import InlineEdit from './InlineEdit';
import { ThemeToggle } from '../context/ThemeContext';

interface Props {
  initialBoard: Board;
  boards?: Board[];
  onBack?: () => void;
  onSelectBoard?: (id: string) => void;
  onBoardChange?: (board: Board) => void | Promise<void>;
  currentUserId?: string;
}

const KanbanBoard: React.FC<Props> = ({ initialBoard, boards, onBack, onSelectBoard, onBoardChange, currentUserId }) => {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeCard, setActiveCard] = useState<{ card: Card; columnId: string } | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ cardId: string; columnId: string } | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [deletedCards, setDeletedCards] = useState<DeletedCardRecord[]>([]);
  const [deletedPanelOpen, setDeletedPanelOpen] = useState(false);
  const [restoreTargets, setRestoreTargets] = useState<Record<string, string>>({});
  const [restoringCardId, setRestoringCardId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#22c55e');
  const [newColumnColor2, setNewColumnColor2] = useState('#3b82f6');

  const COLUMN_ACCENT = ['#22c55e', '#3b82f6', '#f59e0b', '#facc15', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#ffffff'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Sync apenas quando trocar de quadro (nÃ£o a cada save, evitando sobrescrever mudanÃ§as locais)
  React.useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard.id]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const rows = await loadDeletedCards(board.id);
        setDeletedCards(rows);
      } catch (err) {
        console.error('Erro ao carregar cards excluídos:', err);
      }
    };
    load();
  }, [board.id]);


  const persist = useCallback(async (b: Board) => {
    setBoard(b);
    try {
      await saveBoardAPI(b);
      onBoardChange?.(b);
    } catch (err) {
      console.error('Erro ao salvar quadro:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Erro ao salvar: ${msg}`);
    }
  }, [onBoardChange]);

  // â”€â”€ Column operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    const newBoard: Board = {
      ...board,
      columns: [...board.columns, { id: uuidv4(), title, color: newColumnColor, color2: newColumnColor2, cards: [] }],
    };
    persist(newBoard);
    setNewColumnTitle('');
    setNewColumnColor('#22c55e');
    setNewColumnColor2('#3b82f6');
    setAddingColumn(false);
  };

  const recolorColumn = (columnId: string, color: string, color2: string) => {
    persist({
      ...board,
      columns: board.columns.map(c => c.id === columnId ? { ...c, color, color2 } : c),
    });
  };

  const renameColumn = (columnId: string, title: string) => {
    persist({
      ...board,
      columns: board.columns.map(c => c.id === columnId ? { ...c, title } : c),
    });
  };

  const deleteColumn = (columnId: string) => {
    persist({ ...board, columns: board.columns.filter(c => c.id !== columnId) });
  };

  // â”€â”€ Card operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addCard = (columnId: string, title: string) => {
    const newCard: Card = {
      id: uuidv4(),
      title,
      description: '',
      color: '',
      checklist: [],
      comments: [],
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
      priority: '',
      dueDate: '',
      alertMinutes: 30,
    };
    persist({
      ...board,
      columns: board.columns.map(c =>
        c.id === columnId ? { ...c, cards: [...c.cards, newCard] } : c
      ),
    });
  };

  const deleteCard = async (columnId: string, cardId: string) => {
    const column = board.columns.find(c => c.id === columnId);
    const card = column?.cards.find(c => c.id === cardId);
    if (!card) return;

    try {
      await recordDeletedCard({ boardId: board.id, columnId, card });
    } catch (err) {
      console.error('Erro ao registrar card excluído:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Erro ao registrar exclusão: ${msg}`);
      return;
    }

    persist({
      ...board,
      columns: board.columns.map(c =>
        c.id === columnId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c
      ),
    });
  };
  const saveCard = (updatedCard: Card, columnId: string) => {
    persist({
      ...board,
      columns: board.columns.map(c =>
        c.id === columnId
          ? { ...c, cards: c.cards.map(card => card.id === updatedCard.id ? updatedCard : card) }
          : c
      ),
    });
  };
  // â”€â”€ Drag & Drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const restoreCard = async (deleted: DeletedCardRecord, targetColumnId: string) => {
    setRestoringCardId(deleted.id);
    try {
      const restored = await restoreDeletedCard(deleted.id);
      const cardToRestore = restored.card_json as Card;
      const nextBoard: Board = {
        ...board,
        columns: board.columns.map(c =>
          c.id === targetColumnId ? { ...c, cards: [...c.cards, cardToRestore] } : c
        ),
      };

      await persist(nextBoard);
      await removeDeletedCard(deleted.id);
      setDeletedCards(prev => prev.filter(item => item.id !== deleted.id));
    } catch (err) {
      console.error('Erro ao restaurar card:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Erro ao restaurar card: ${msg}`);
    } finally {
      setRestoringCardId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'card') {
      const colId = active.data.current?.columnId as string;
      const col = board.columns.find(c => c.id === colId);
      const card = col?.cards.find(card => card.id === active.id);
      if (card) setActiveCard({ card, columnId: colId });
    } else if (type === 'column') {
      setActiveColumnId(active.id as string);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeColId = active.data.current?.columnId as string;
    let overColId: string | null = null;

    // over another card?
    if (over.data.current?.type === 'card') {
      overColId = over.data.current?.columnId as string;
    }
    // over a column droppable zone?
    if (over.id.toString().startsWith('col-')) {
      overColId = over.id.toString().replace('col-', '');
    }

    if (!overColId || activeColId === overColId) return;

    // Move card across columns
    setBoard(prev => {
      const srcCol = prev.columns.find(c => c.id === activeColId);
      const dstCol = prev.columns.find(c => c.id === overColId);
      if (!srcCol || !dstCol) return prev;

      const card = srcCol.cards.find(c => c.id === active.id);
      if (!card) return prev;

      const newColumns = prev.columns.map(col => {
        if (col.id === activeColId) return { ...col, cards: col.cards.filter(c => c.id !== active.id) };
        if (col.id === overColId) return { ...col, cards: [...col.cards, { ...card }] };
        return col;
      });

      // Update active card's column tracking
      if (active.data.current) {
        active.data.current.columnId = overColId;
      }

      return { ...prev, columns: newColumns };
    });
  };

  const getColumnDropTargetId = (over: DragEndEvent['over']): string | null => {
    if (!over) return null;

    if (over.data.current?.type === 'column') {
      return over.id as string;
    }

    const overId = String(over.id);
    if (overId.startsWith('col-')) {
      return overId.replace('col-', '');
    }

    if (over.data.current?.columnId) {
      return over.data.current.columnId as string;
    }

    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumnId(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    // Reorder columns
    if (activeType === 'column') {
      const oldIndex = board.columns.findIndex(c => c.id === active.id);
      const targetColumnId = getColumnDropTargetId(over);
      const newIndex = board.columns.findIndex(c => c.id === targetColumnId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        persist({ ...board, columns: arrayMove(board.columns, oldIndex, newIndex) });
      }
      return;
    }

    // Reorder cards within same column
    if (activeType === 'card') {
      const colId = active.data.current?.columnId as string;
      const col = board.columns.find(c => c.id === colId);
      if (!col) return;

      const oldIndex = col.cards.findIndex(c => c.id === active.id);
      const newIndex = col.cards.findIndex(c => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newCols = board.columns.map(c =>
          c.id === colId ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) } : c
        );
        persist({ ...board, columns: newCols });
      }
    }
  };

  const modalCard = modalState
    ? board.columns
        .find(c => c.id === modalState.columnId)
        ?.cards.find(card => card.id === modalState.cardId)
    : null;

  const handleSendToBoard = useCallback(async (cardTitle: string, itemText: string, targetBoardId: string, targetColId: string) => {
    const targetBoard = boards?.find(b => b.id === targetBoardId);
    if (!targetBoard) return;
    const newCard: Card = {
      id: uuidv4(),
      title: cardTitle,
      description: itemText,
      color: '',
      checklist: [],
      comments: [],
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
      priority: '',
      dueDate: '',
      alertMinutes: 30,
    };
    const updatedBoard: Board = {
      ...targetBoard,
      columns: targetBoard.columns.map(col =>
        col.id === targetColId ? { ...col, cards: [...col.cards, newCard] } : col
      ),
    };
    await saveBoardAPI(updatedBoard);
  }, [boards]);

  const activeOverlayColumn = activeColumnId
    ? board.columns.find(c => c.id === activeColumnId)
    : null;

  const totalCards = board.columns.reduce((acc, c) => acc + c.cards.length, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              title="Voltar aos quadros"
            >
              â†
            </button>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-badge)', border: '1px solid var(--accent-badge-border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>K</span>
          </div>
          <div className="flex-shrink-0">
            <InlineEdit
              value={board.title}
              onSave={v => persist({ ...board, title: v })}
              className="font-semibold leading-tight"
              inputClassName="" tag="h1"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', color: 'var(--text-primary)' }}
            />
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {totalCards} {totalCards === 1 ? 'tarefa' : 'tarefas'} Â· {board.columns.length} {board.columns.length === 1 ? 'coluna' : 'colunas'}
            </p>
          </div>
          {/* Board switcher */}
          {boards && boards.length > 1 && onSelectBoard && (() => {
            const others = boards.filter(b => b.id !== board.id);
            const MAX = 4;
            const visible = others.slice(0, MAX);
            const overflow = others.slice(MAX);
            return (
              <div className="flex items-center gap-1.5 pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
                {visible.map(b => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBoard(b.id)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all flex-shrink-0"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--text-subtle)', maxWidth: '130px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-md)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-subtle)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    title={b.title}
                  >
                    <span className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--accent-badge)', color: 'var(--accent)' }}>
                      {b.title.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate" style={{ maxWidth: '80px', fontSize: '12px', fontFamily: "'Playfair Display', serif" }}>{b.title}</span>
                  </button>
                ))}
                {overflow.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setSwitcherOpen(o => !o)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-all flex-shrink-0"
                      style={{ background: switcherOpen ? 'var(--accent-faint)' : 'var(--glass-bg)', border: `1px solid ${switcherOpen ? 'var(--accent-glow)' : 'var(--border)'}`, color: switcherOpen ? 'var(--accent)' : 'var(--text-subtle)' }}
                      onMouseEnter={e => { if (!switcherOpen) { e.currentTarget.style.background = 'var(--glass-md)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                      onMouseLeave={e => { if (!switcherOpen) { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-subtle)'; } }}
                    >
                      <span style={{ fontSize: '12px' }}>+{overflow.length}</span>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" style={{ marginTop: '1px' }}>
                        <path d="M6 8.5L1.5 4h9L6 8.5z"/>
                      </svg>
                    </button>
                    {switcherOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                        <div
                          className="absolute left-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
                          style={{ background: '#171a27', border: '1px solid #2b2e3a', minWidth: '200px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                        >
                          {overflow.map(b => (
                            <button
                              key={b.id}
                              onClick={() => { setSwitcherOpen(false); onSelectBoard(b.id); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                              style={{ color: '#e2e8f0' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: 'rgba(7,217,99,0.12)', color: '#07d963' }}>
                                {b.title.charAt(0).toUpperCase()}
                              </span>
                              <span className="text-sm truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{b.title}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDeletedPanelOpen(true)}
            className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
            style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            Cards excluídos
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{deletedCards.length}</span>
          </button>
          <button
            onClick={() => setAddingColumn(true)}
            className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-subtle)'; }}
          >
            <span className="text-base leading-none font-light">+</span>
            Nova coluna
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={board.columns.map(c => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-5 items-start min-w-max pb-4">
              {board.columns.map((col: Column, colIndex: number) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  index={colIndex}
                  onAddCard={addCard}
                  currentUserId={currentUserId}
                  onDeleteCard={deleteCard}
                  onOpenCard={(cardId, columnId) => setModalState({ cardId, columnId })}
                  onRenameColumn={renameColumn}
                  onDeleteColumn={deleteColumn}
                  onRecolorColumn={recolorColumn}
                />
              ))}

              {/* Add column */}
              {addingColumn && (
                <div className="flex-shrink-0 w-[300px] rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-glow)' }}>
                  <input
                    autoFocus
                    value={newColumnTitle}
                    onChange={e => setNewColumnTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addColumn();
                      if (e.key === 'Escape') { setAddingColumn(false); setNewColumnTitle(''); }
                    }}
                    placeholder="Nome da coluna..."
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
                  />
                  {/* Color swatches */}
                  <div className="flex flex-col gap-1.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>InÃ­cio</span>
                      {COLUMN_ACCENT.map(c => (
                        <button key={c} onClick={() => setNewColumnColor(c)}
                          className="w-5 h-5 rounded-full flex-shrink-0 transition-transform"
                          style={{ background: c, outline: newColumnColor === c ? `2px solid ${c === '#ffffff' ? '#aaa' : c}` : 'none', outlineOffset: 2, transform: newColumnColor === c ? 'scale(1.25)' : 'scale(1)', border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>Fim</span>
                      {COLUMN_ACCENT.map(c => (
                        <button key={c} onClick={() => setNewColumnColor2(c)}
                          className="w-5 h-5 rounded-full flex-shrink-0 transition-transform"
                          style={{ background: c, outline: newColumnColor2 === c ? `2px solid ${c === '#ffffff' ? '#aaa' : c}` : 'none', outlineOffset: 2, transform: newColumnColor2 === c ? 'scale(1.25)' : 'scale(1)', border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                        />
                      ))}
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: `linear-gradient(to right, ${newColumnColor}, ${newColumnColor2})` }} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addColumn}
                      className="flex-1 text-xs py-1.5 rounded-md font-semibold transition-colors"
                      style={{ background: '#07d963', color: '#0d0f16' }}
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => { setAddingColumn(false); setNewColumnTitle(''); }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-md transition-colors"
                      style={{ background: '#242838', color: '#7a7f8c' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeCard && (
              <div className="rotate-1 scale-103 opacity-90">
                <KanbanCard
                  card={activeCard.card}
                  columnId={activeCard.columnId}
                  onOpen={() => {}}
                  onDelete={() => {}}
                />
              </div>
            )}
            {activeOverlayColumn && (
              <div className="rotate-1 w-[300px] h-24 rounded-xl" style={{ background: 'rgba(7,217,99,0.04)', border: '1px solid rgba(7,217,99,0.15)' }} />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Card Modal */}
      {modalCard && modalState && (
        <CardModal
          card={modalCard}
          onClose={() => setModalState(null)}
          onSave={updated => saveCard(updated, modalState.columnId)}
          onDelete={() => deleteCard(modalState.columnId, modalState.cardId)}
          boards={boards}
          onSendToBoard={handleSendToBoard}
          currentUserId={currentUserId}
        />
      )}
      {deletedPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDeletedPanelOpen(false)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l" style={{ background: 'var(--bg-main)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Cards excluídos</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{deletedCards.length} card(s) armazenado(s)</p>
              </div>
              <button onClick={() => setDeletedPanelOpen(false)} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Fechar</button>
            </div>

            <div className="p-4 space-y-3">
              {deletedCards.length === 0 ? (
                <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  Nenhum card excluído neste quadro.
                </div>
              ) : deletedCards.map(dc => {
                const selectedColumnId = restoreTargets[dc.id] || dc.column_id || board.columns[0]?.id || '';
                return (
                  <div key={dc.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{dc.title}</div>
                      <div className="text-sm mt-1 line-clamp-3" style={{ color: 'var(--text-muted)' }}>{dc.description || 'Sem descrição'}</div>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                      Excluído em {new Date(dc.deleted_at).toLocaleString('pt-BR')}
                    </div>
                    <label className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                      Restaurar para coluna
                      <select
                        className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
                        value={selectedColumnId}
                        onChange={e => setRestoreTargets(prev => ({ ...prev, [dc.id]: e.target.value }))}
                        style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      >
                        {board.columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                      </select>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => restoreCard(dc, selectedColumnId)}
                        disabled={restoringCardId === dc.id || !selectedColumnId}
                        className="flex-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
                        style={{ background: '#07d963', color: '#0d0f16' }}
                      >
                        {restoringCardId === dc.id ? 'Restaurando...' : 'Restaurar'}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await removeDeletedCard(dc.id);
                            setDeletedCards(prev => prev.filter(item => item.id !== dc.id));
                          } catch (err) {
                            console.error('Erro ao excluir registro do card:', err);
                          }
                        }}
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      >
                        Remover da lista
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;


