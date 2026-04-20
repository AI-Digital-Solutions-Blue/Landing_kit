import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ContactModalContext = createContext(null)

export function ContactModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => ({ isOpen, openModal, closeModal }), [isOpen, openModal, closeModal])

  return <ContactModalContext.Provider value={value}>{children}</ContactModalContext.Provider>
}

export function useContactModal() {
  const ctx = useContext(ContactModalContext)
  if (!ctx) {
    throw new Error('useContactModal debe usarse dentro de ContactModalProvider')
  }
  return ctx
}
