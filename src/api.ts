import type { Board } from './types';

const API_URL = 'http://localhost:3001/api';

export async function loadBoards(): Promise<Board[]> {
  const res = await fetch(`${API_URL}/boards`);
  if (!res.ok) throw new Error(`Erro ao carregar quadros: ${res.statusText}`);
  return res.json();
}

export async function createBoard(board: Board): Promise<void> {
  const res = await fetch(`${API_URL}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
  if (!res.ok) throw new Error(`Erro ao criar quadro: ${res.statusText}`);
}

export async function saveBoard(board: Board): Promise<void> {
  const res = await fetch(`${API_URL}/boards/${board.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
  if (!res.ok) throw new Error(`Erro ao salvar quadro: ${res.statusText}`);
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/boards/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erro ao excluir quadro: ${res.statusText}`);
}
