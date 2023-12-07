// Stores allows access of venues from any component at any time
// by using the hook `const venues = useVenueStore((state) => state.venues)`

// At initial page load we fetch all venues and updates the store
// using the function `const setVenues = useVenueStore((state) => state.setVenues)`
// and then the venues will be accessible from all components

import { Venue } from '@prisma/client'
// We use 'zustand' for global state management (or stores)
import { create } from 'zustand'

interface VenueStore {
  venues: Venue[],
  setVenues: (newVenues: Venue[]) => void
}

// Create and export the store
export const useVenueStore = create<VenueStore>()((set) => ({
  venues: [],
  setVenues: (newVenues) => set(() => ({ venues: newVenues }))
}))