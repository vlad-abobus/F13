import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UsersTab from '../UsersTab'
import { UseMutationResult } from '@tanstack/react-query'

// Mock mutations
const createMockMutation = (): UseMutationResult<any, unknown, any, unknown> => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  isIdle: true,
  status: 'idle',
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  submittedAt: 0,
  variables: undefined,
  context: undefined,
  isPaused: false,
})

describe('UsersTab', () => {
  const mockUsers = [
    {
      id: '1',
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      status: 'user',
      is_banned: false,
      is_muted: false,
    },
    {
      id: '2',
      username: 'banneduser',
      avatar_url: undefined,
      status: 'user',
      is_banned: true,
      is_muted: false,
    },
    {
      id: '3',
      username: 'muteduser',
      avatar_url: undefined,
      status: 'user',
      is_banned: false,
      is_muted: true,
    },
  ]

  it('renders users list', () => {
    render(
      <UsersTab
        users={mockUsers}
        banUserMutation={createMockMutation()}
        unbanUserMutation={createMockMutation()}
        muteUserMutation={createMockMutation()}
        unmuteUserMutation={createMockMutation()}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('banneduser')).toBeInTheDocument()
    expect(screen.getByText('muteduser')).toBeInTheDocument()
  })

  it('shows ban button for unbanned users', () => {
    const banMutation = createMockMutation()
    render(
      <UsersTab
        users={[mockUsers[0]]}
        banUserMutation={banMutation}
        unbanUserMutation={createMockMutation()}
        muteUserMutation={createMockMutation()}
        unmuteUserMutation={createMockMutation()}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    const banButton = screen.getByText('Забанить')
    expect(banButton).toBeInTheDocument()
  })

  it('shows unban button for banned users', () => {
    const unbanMutation = createMockMutation()
    render(
      <UsersTab
        users={[mockUsers[1]]}
        banUserMutation={createMockMutation()}
        unbanUserMutation={unbanMutation}
        muteUserMutation={createMockMutation()}
        unmuteUserMutation={createMockMutation()}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    const unbanButton = screen.getByText('Разбанить')
    expect(unbanButton).toBeInTheDocument()
  })

  it('shows mute input and button for unmuted users', () => {
    const muteMutation = createMockMutation()
    render(
      <UsersTab
        users={[mockUsers[0]]}
        banUserMutation={createMockMutation()}
        unbanUserMutation={createMockMutation()}
        muteUserMutation={muteMutation}
        unmuteUserMutation={createMockMutation()}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    const muteInput = screen.getByPlaceholderText('Часы')
    const muteButton = screen.getByText('Замутить')
    expect(muteInput).toBeInTheDocument()
    expect(muteButton).toBeInTheDocument()
  })

  it('shows unmute button for muted users', () => {
    const unmuteMutation = createMockMutation()
    render(
      <UsersTab
        users={[mockUsers[2]]}
        banUserMutation={createMockMutation()}
        unbanUserMutation={createMockMutation()}
        muteUserMutation={createMockMutation()}
        unmuteUserMutation={unmuteMutation}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    const unmuteButton = screen.getByText('Размутить')
    expect(unmuteButton).toBeInTheDocument()
  })

  it('displays empty state when no users', () => {
    render(
      <UsersTab
        users={[]}
        banUserMutation={createMockMutation()}
        unbanUserMutation={createMockMutation()}
        muteUserMutation={createMockMutation()}
        unmuteUserMutation={createMockMutation()}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    expect(screen.getByText('Нет пользователей')).toBeInTheDocument()
  })

  it('calls ban mutation when ban button is clicked', async () => {
    const banMutation = createMockMutation()
    const mutateSpy = vi.fn()
    banMutation.mutate = mutateSpy

    render(
      <UsersTab
        users={[mockUsers[0]]}
        banUserMutation={banMutation}
        unbanUserMutation={createMockMutation()}
        muteUserMutation={createMockMutation()}
        unmuteUserMutation={createMockMutation()}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    const banButton = screen.getByText('Забанить')
    banButton.click()

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('1')
    })
  })

  it('calls mute mutation with correct parameters', async () => {
    const muteMutation = createMockMutation()
    const mutateSpy = vi.fn()
    muteMutation.mutate = mutateSpy

    render(
      <UsersTab
        users={[mockUsers[0]]}
        banUserMutation={createMockMutation()}
        unbanUserMutation={createMockMutation()}
        muteUserMutation={muteMutation}
        unmuteUserMutation={createMockMutation()}
        makeAdminMutation={createMockMutation()}
        removeAdminMutation={createMockMutation()}
        warnUserMutation={createMockMutation()}
        kickUserMutation={createMockMutation()}
        restrictPostingMutation={createMockMutation()}
        allowPostingMutation={createMockMutation()}
      />
    )

    const muteInput = screen.getByPlaceholderText('Часы')
    muteInput.setAttribute('value', '48')
    muteInput.dispatchEvent(new Event('change', { bubbles: true }))

    const muteButton = screen.getByText('Замутить')
    muteButton.click()

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith({ userId: '1', hours: 24 }) // Default is 24
    })
  })
})
