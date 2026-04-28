import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

const STORAGE_KEY = 'todolist-demo-todos'

function seedDefaults() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      { id: 1, text: 'Read a book', done: false },
      { id: 2, text: 'Go for a walk', done: true },
      { id: 3, text: 'Write some code', done: false },
    ]),
  )
}

describe('NFR4 keyboard shortcuts', () => {
  it('creates a todo when Enter is pressed in the add field', async () => {
    localStorage.clear()
    localStorage.setItem(STORAGE_KEY, '[]')
    const user = userEvent.setup()
    render(<App />)

    const field = screen.getByLabelText('New todo title')
    await user.type(field, 'Buy milk{Enter}')

    expect(
      screen.getByRole('button', { name: 'Buy milk. Press F2 to edit.' }),
    ).toBeInTheDocument()
  })

  describe('with seeded todos', () => {
    beforeEach(() => {
      localStorage.clear()
      seedDefaults()
    })

    it('saves an inline edit when Enter is pressed', async () => {
      const user = userEvent.setup()
      render(<App />)

      const rowBtn = screen.getByRole('button', { name: 'Read a book. Press F2 to edit.' })
      await user.dblClick(rowBtn)

      const editor = screen.getByLabelText(/Editing: Read a book/)
      await user.clear(editor)
      await user.type(editor, 'Read two books{Enter}')

      expect(
        screen.getByRole('button', { name: 'Read two books. Press F2 to edit.' }),
      ).toBeInTheDocument()
    })

    it('cancels an inline edit when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<App />)

      const rowBtn = screen.getByRole('button', { name: 'Read a book. Press F2 to edit.' })
      await user.dblClick(rowBtn)

      const editor = screen.getByLabelText(/Editing: Read a book/)
      await user.clear(editor)
      await user.type(editor, 'Temporary{Escape}')

      expect(
        screen.getByRole('button', { name: 'Read a book. Press F2 to edit.' }),
      ).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Temporary')).not.toBeInTheDocument()
    })

    it('triggers Undo from the keyboard while the delete toast is visible', async () => {
      const user = userEvent.setup()
      render(<App />)

      const row = screen.getByRole('button', { name: 'Read a book. Press F2 to edit.' }).closest('li')
      await user.hover(row)
      await user.click(screen.getByRole('button', { name: 'Delete Read a book' }))

      const toast = screen.getByRole('status')
      expect(toast).toHaveAttribute('aria-live', 'polite')
      expect(within(toast).getByRole('button', { name: 'Undo' })).toBeInTheDocument()

      await user.keyboard('{Control>}z{/Control}')

      expect(screen.queryByText('Todo removed.')).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Read a book. Press F2 to edit.' }),
      ).toBeInTheDocument()
    })
  })
})

describe('NFR9 persistence robustness', () => {
  it('renders with an empty list when localStorage contains malformed JSON', () => {
    localStorage.clear()
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    render(<App />)

    expect(screen.getByText('Nothing here.')).toBeInTheDocument()
  })
})

describe('FR6 clear completed', () => {
  it('removes every completed todo and disables the control when none are completed', async () => {
    localStorage.clear()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 1, text: 'Open', done: false },
        { id: 2, text: 'Done', done: true },
      ]),
    )
    const user = userEvent.setup()
    render(<App />)

    const clearBtn = screen.getByRole('button', { name: 'Clear all completed todos' })
    expect(clearBtn).not.toBeDisabled()

    await user.click(clearBtn)

    expect(screen.getByRole('button', { name: 'Open. Press F2 to edit.' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Done, completed. Press F2 to edit.' }),
    ).not.toBeInTheDocument()
    expect(clearBtn).toBeDisabled()
  })
})
