import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ContactModalContext = createContext(null)

const DESKTOP_MEDIA_QUERY = '(min-width: 641px)'

function getInitialContactModalOpen() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
}

export function ContactModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(getInitialContactModalOpen)
  const [isLeadOpen, setIsLeadOpen] = useState(false)
  const [isEligibilityOpen, setIsEligibilityOpen] = useState(false)

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])

  const openLeadModal = useCallback(() => setIsLeadOpen(true), [])
  const closeLeadModal = useCallback(() => setIsLeadOpen(false), [])

  const openEligibilityModal = useCallback(() => setIsEligibilityOpen(true), [])
  const closeEligibilityModal = useCallback(() => setIsEligibilityOpen(false), [])

  const value = useMemo(
    () => ({
      isOpen,
      openModal,
      closeModal,
      isLeadOpen,
      openLeadModal,
      closeLeadModal,
      isEligibilityOpen,
      openEligibilityModal,
      closeEligibilityModal,
    }),
    [
      isOpen,
      openModal,
      closeModal,
      isLeadOpen,
      openLeadModal,
      closeLeadModal,
      isEligibilityOpen,
      openEligibilityModal,
      closeEligibilityModal,
    ],
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
