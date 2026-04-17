import { Header } from './Header.js'
import { Main } from './Main.js'
import { Footer } from './Footer.js'

export function Layout() {
  return `${Header()}
${Main()}
${Footer()}`
}
