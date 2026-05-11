import { useContactModal } from '../../context/ContactModalContext'

/**
 * Enlace que abre el modal de lead (formulario largo). Usar para CTAs
 * que deben llevar al formulario completo en lugar del click-to-call.
 */
export function CtaOpenLeadModalLink({ className, children, ...rest }) {
  const { openLeadModal } = useContactModal()

  return (
    <a
      {...rest}
      href="#contacto"
      className={className}
      onClick={(e) => {
        e.preventDefault()
        openLeadModal()
      }}
    >
      {children}
    </a>
  )
}
