export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export type Priority = 'baixa' | 'media' | 'alta' | '';

export interface Card {
  id: string;
  title: string;
  description: string;
  color: string;
  checklist: ChecklistItem[];
  createdAt: string;
  priority: Priority;
  dueDate: string;       // datetime-local string or ''
  alertMinutes: number;  // minutes before due date
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
}
