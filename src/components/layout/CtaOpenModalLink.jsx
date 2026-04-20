import { useContactModal } from '../../context/ContactModalContext'

/**
 * Enlace que abre el formulario en modal (no navega). Usar en CTAs salvo excepciones (tel, PDF, etc.).
 */
export function CtaOpenModalLink({ className, children, ...rest }) {
  const { openModal } = useContactModal()

  return (
    <a
      {...rest}
      href="#contacto"
      className={className}
      onClick={(e) => {
        e.preventDefault()
        openModal()
      }}
    >
      {children}
    </a>
  )
}
