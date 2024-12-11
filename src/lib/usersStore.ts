// Stores allows access of users from any component at any time
// by using the hook `const users = useUserStore((state) => state.users)`

// At initial page load we fetch all users and updates the store
// using the function `const setUsers = useUserStore((state) => state.setUsers)`
// and then the users will be accessible from all components

import { User } from '@prisma/client'
// We use 'zustand' for global state management (or stores)
import { create } from 'zustand'

interface UserStore {
  users: User[],
  setUsers: (newUsers: User[]) => void
}

// Create and export the store
export const useUserStore = create<UserStore>()((set) => ({
  users: [],
  setUsers: (newUsers) => set(() => ({ users: newUsers }))
}))