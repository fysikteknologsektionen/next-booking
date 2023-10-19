import { Venue } from '@prisma/client'
import { create } from 'zustand'

interface VenueStore {
  venues: Venue[],
  setVenues: (newVenues: Venue[]) => void
}

export const useVenueStore = create<VenueStore>()((set) => ({
  venues: [],
  setVenues: (newVenues) => set(() => ({ venues: newVenues }))
}))