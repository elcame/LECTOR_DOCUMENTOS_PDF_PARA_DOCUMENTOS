import { createContext, useContext } from 'react'

const PaintColorContext = createContext('#f4f6f8')

export function PaintColorProvider({ color, children }) {
  return <PaintColorContext.Provider value={color}>{children}</PaintColorContext.Provider>
}

export function usePaintColor() {
  return useContext(PaintColorContext)
}
