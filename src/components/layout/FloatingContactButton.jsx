import { useEffect, useState } from 'react'
import { useContactModal } from '../../context/ContactModalContext'
import './FloatingContactButton.css'

const ROTATING_MESSAGES = ['¡Te llamamos!', 'Activa tu bono']
const ROTATION_INTERVAL_MS = 3000
const FADE_DURATION_MS = 220

export function FloatingContactButton() {
  const { openModal, isOpen } = useContactModal()
  const [messageIndex, setMessageIndex] = useState(0)
  const [isTextVisible, setIsTextVisible] = useState(true)

  useEffect(() => {
    let timeoutId = 0
    const intervalId = window.setInterval(() => {
      setIsTextVisible(false)
      timeoutId = window.setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length)
        setIsTextVisible(true)
      }, FADE_DURATION_MS)
    }, ROTATION_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [])

  const handleOpenModal = () => {
    openModal()
  }

  if (isOpen) return null

  return (
    <div className="floating-contact" aria-label="Abrir opciones de contacto">
      <button type="button" className="floating-contact__pill" onClick={handleOpenModal}>
        <span className={`floating-contact__pill-text${isTextVisible ? '' : ' floating-contact__pill-text--hidden'}`}>
          {ROTATING_MESSAGES[messageIndex]}
        </span>
      </button>
      <button
        type="button"
        className="floating-contact__bubble"
        onClick={handleOpenModal}
        aria-label="Abrir formulario de contacto"
      >
        <svg
          className="floating-contact__bubble-icon"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M6.5 17.5L4 20V6.75C4 5.7835 4.7835 5 5.75 5H18.25C19.2165 5 20 5.7835 20 6.75V15.25C20 16.2165 19.2165 17 18.25 17H6.5V17.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <circle cx="12" cy="11" r="1" fill="currentColor" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
