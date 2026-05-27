import type { Board } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'kanban-board';

const defaultBoard: Board = {
  id: uuidv4(),
  title: 'Meu Quadro Kanban',
  columns: [
    {
      id: uuidv4(),
      title: 'A Fazer',
      cards: [
        {
          id: uuidv4(),
          title: 'Planejar o projeto',
          description: 'Definir escopo e objetivos do projeto.',
          color: '#f87171',
          checklist: [
            { id: uuidv4(), text: 'Reunião de kickoff', done: false },
            { id: uuidv4(), text: 'Definir stakeholders', done: false },
          ],
          createdAt: new Date().toISOString(),
          priority: 'alta',
          dueDate: '',
          alertMinutes: 30,
        },
      ],
    },
    {
      id: uuidv4(),
      title: 'Em Progresso',
      cards: [
        {
          id: uuidv4(),
          title: 'Desenvolver protótipo',
          description: 'Criar protótipo de alta fidelidade no Figma.',
          color: '#fb923c',
          checklist: [
            { id: uuidv4(), text: 'Wireframes', done: true },
            { id: uuidv4(), text: 'Design final', done: false },
          ],
          createdAt: new Date().toISOString(),
          priority: 'media',
          dueDate: '',
          alertMinutes: 30,
        },
      ],
    },
    {
      id: uuidv4(),
      title: 'Concluído',
      cards: [
        {
          id: uuidv4(),
          title: 'Levantamento de requisitos',
          description: 'Entrevistas com usuários e documentação.',
          color: '#4ade80',
          checklist: [
            { id: uuidv4(), text: 'Entrevistas', done: true },
            { id: uuidv4(), text: 'Documentação', done: true },
          ],
          createdAt: new Date().toISOString(),
          priority: 'baixa',
          dueDate: '',
          alertMinutes: 30,
        },
      ],
    },
  ],
};

function migrateCard(card: Record<string, unknown>): Record<string, unknown> {
  return {
    priority: '',
    dueDate: '',
    alertMinutes: 30,
    ...card,
  };
}

export function loadBoard(): Board {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Board;
      // Migrate old cards that may lack new fields
      parsed.columns = parsed.columns.map(col => ({
        ...col,
        cards: col.cards.map(c => migrateCard(c as unknown as Record<string, unknown>) as unknown as typeof c),
      }));
      return parsed;
    }
  } catch {
    // ignore
  }
  return defaultBoard;
}

export function saveBoard(board: Board): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}
