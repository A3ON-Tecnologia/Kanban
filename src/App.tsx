import './index.css'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadBoards, saveBoards } from './storage'
import type { Board } from './types'
import KanbanBoard from './components/KanbanBoard'
import BoardList from './components/BoardList'

function App() {
  const [boards, setBoards] = useState<Board[]>(loadBoards)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedBoard = boards.find(b => b.id === selectedId) ?? null

  const updateBoards = (updated: Board[]) => {
    setBoards(updated)
    saveBoards(updated)
  }

  const handleCreate = (title: string) => {
    const newBoard: Board = { id: uuidv4(), title, columns: [] }
    const updated = [...boards, newBoard]
    updateBoards(updated)
    setSelectedId(newBoard.id)
  }

  const handleDelete = (id: string) => {
    updateBoards(boards.filter(b => b.id !== id))
  }

  const handleRename = (id: string, title: string) => {
    updateBoards(boards.map(b => b.id === id ? { ...b, title } : b))
  }

  const handleBoardChange = (board: Board) => {
    updateBoards(boards.map(b => b.id === board.id ? board : b))
  }

  if (selectedBoard) {
    return (
      <KanbanBoard
        initialBoard={selectedBoard}
        onBack={() => setSelectedId(null)}
        onBoardChange={handleBoardChange}
      />
    )
  }

  return (
    <BoardList
      boards={boards}
      onSelect={setSelectedId}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onRename={handleRename}
    />
  )
}

export default App
