import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ContactModalContext = createContext(null)

export function ContactModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLeadOpen, setIsLeadOpen] = useState(false)

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])
  const openLeadModal = useCallback(() => setIsLeadOpen(true), [])
  const closeLeadModal = useCallback(() => setIsLeadOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, openModal, closeModal, isLeadOpen, openLeadModal, closeLeadModal }),
    [isOpen, openModal, closeModal, isLeadOpen, openLeadModal, closeLeadModal],
  )

  return <ContactModalContext.Provider value={value}>{children}</ContactModalContext.Provider>
}

export function useContactModal() {
  const ctx = useContext(ContactModalContext)
  if (!ctx) {
    throw new Error('useContactModal debe usarse dentro de ContactModalProvider')
  }
  return ctx
}
