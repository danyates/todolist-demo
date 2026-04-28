import { useState, useRef, useEffect } from 'react'

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Read a book', done: false },
    { id: 2, text: 'Go for a walk', done: true },
    { id: 3, text: 'Write some code', done: false },
  ])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')

  // --- Inline edit state ---
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const editInputRef = useRef(null)

  // Focus the edit input whenever we enter edit mode
  useEffect(() => {
    if (editingId !== null) {
      editInputRef.current?.focus()
    }
  }, [editingId])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos([...todos, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggleTodo = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const deleteTodo = (id) => setTodos(todos.filter((t) => t.id !== id))

  // --- Inline edit handlers ---
  const startEdit = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed === '') {
      deleteTodo(editingId)
    } else {
      setTodos(todos.map((t) => (t.id === editingId ? { ...t, text: trimmed } : t)))
    }
    setEditingId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  // NFR2: allow keyboard users to enter edit mode via Enter or F2 on the todo button
  const handleTodoKeyDown = (e, todo) => {
    if (e.key === 'F2') {
      e.preventDefault()
      startEdit(todo)
    }
  }

  const visible = todos.filter((t) =>
    filter === 'active' ? !t.done : filter === 'completed' ? t.done : true,
  )
  const remaining = todos.filter((t) => !t.done).length

  const tabClass = (name) =>
    `px-3 py-1 rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      filter === name
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-200'
    }`

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Todo List</h1>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs doing?"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
          <button
            onClick={addTodo}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Add
          </button>
        </div>

        {/* NFR3: aria-pressed exposes selected state to screen readers */}
        <div className="flex gap-2 mb-4" role="group" aria-label="Filter todos">
          {['all', 'active', 'completed'].map((name) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={tabClass(name)}
              aria-pressed={filter === name}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {visible.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50"
            >
              {editingId === todo.id ? (
                // ---- Edit mode ----
                <input
                  ref={editInputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  aria-label={`Editing: ${todo.text}`}
                  className="flex-1 px-1 py-0.5 border-b-2 border-indigo-500 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-transparent text-slate-800"
                />
              ) : (
                // ---- View mode ----
                // NFR2: F2 lets keyboard users enter edit mode without a mouse
                // Double-click still works for mouse users
                <button
                  onClick={() => toggleTodo(todo.id)}
                  onDoubleClick={() => startEdit(todo)}
                  onKeyDown={(e) => handleTodoKeyDown(e, todo)}
                  aria-label={`${todo.text}${todo.done ? ', completed' : ''}. Press F2 to edit.`}
                  className={`flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${
                    todo.done ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {todo.text}
                </button>
              )}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-slate-400 hover:text-red-500 text-lg font-bold px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                aria-label={`Delete ${todo.text}`}
              >
                ×
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-center text-slate-400 py-4 text-sm">
              Nothing here.
            </li>
          )}
        </ul>
        <div className="mt-4 text-sm text-slate-500">
          {remaining} {remaining === 1 ? 'item' : 'items'} left
        </div>
      </div>
    </div>
  )
}
