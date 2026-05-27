import './index.css'
import { loadBoard } from './storage'
import KanbanBoard from './components/KanbanBoard'

const board = loadBoard()

function App() {
  return <KanbanBoard initialBoard={board} />
}

export default App
