import { create } from 'zustand'

interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
  toggleOpen: () => void
  toggleCollapsed: () => void
  setOpen: (isOpen: boolean) => void
  setCollapsed: (isCollapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false, // mobile open drawer state
  isCollapsed: false, // desktop collapsed state
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setOpen: (isOpen) => set({ isOpen }),
  setCollapsed: (isCollapsed) => set({ isCollapsed }),
}))
