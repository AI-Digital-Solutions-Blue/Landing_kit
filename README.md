# Landing Kit

Landing page for the **Kit Digital** programme built with **React 18** and **Vite 6**.
The site showcases the digital-kit solutions catalogue, collects leads via a contact form (webhook integration with Make.com), and includes legal pages (terms & privacy).

## Tech Stack

| Library / Tool | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | ^18.3.1 | UI framework |
| [React DOM](https://react.dev/) | ^18.3.1 | DOM renderer |
| [Vite](https://vitejs.dev/) | ^6.0.3 | Dev server & production bundler |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | ^4.3.4 | React Fast-Refresh & JSX support |
| [npm](https://www.npmjs.com/) | ≥ 9 | Package manager (npm is used; yarn is also compatible) |
| [Node.js](https://nodejs.org/) | ≥ 18 | JavaScript runtime |

## Project Structure

```
Landing_kit/
├── public/               # Static assets (SVGs, images, downloads)
├── src/
│   ├── assets/           # Imported assets
│   ├── components/
│   │   ├── layout/       # Page sections & modals (Header, Footer, Form, etc.)
│   │   └── pages/        # Full-page views (Terms, Privacy)
│   ├── config/           # App configuration (webhook URLs)
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── legal/            # Legal content (HTML fragments)
│   ├── styles/           # Global CSS
│   ├── App.jsx           # Root component & hash-based router
│   └── main.jsx          # Entry point
├── index.html            # HTML shell
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies & scripts
└── jsconfig.json         # Editor / IDE settings
```

## Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9 (ships with Node.js) — or **yarn** ≥ 1.22

## Installation

```bash
# Clone the repository
git clone https://github.com/AI-Digital-Solutions-Blue/Landing_kit.git
cd Landing_kit

# Install dependencies
npm install
# or
yarn install
```

## Development

Start the Vite dev server with hot-module replacement:

```bash
npm run dev
# or
yarn dev
```

The app will be available at **http://localhost:5173** by default.

## Production Build

Generate an optimized static bundle in the `dist/` folder:

```bash
npm run build
# or
yarn build
```

### Preview the production build locally

```bash
npm run preview
# or
yarn preview
```

This serves the contents of `dist/` at **http://localhost:4173**.

## Production Deployment

Because the build output is a set of **static files** (`dist/`), you can serve them with any web server (Nginx, Apache, Caddy, a CDN, etc.).

### Serving with a simple Node.js static server

```bash
# Install a lightweight static server globally (one-time)
npm install -g serve

# Serve the production build
serve -s dist
```

### Serving with PM2 (process manager)

If you need the production server to stay alive, auto-restart on failure, and survive reboots, use [PM2](https://pm2.keymetrics.io/):

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Install a static file server globally (one-time)
npm install -g serve

# Start the static server under PM2
pm2 start serve --name landing-kit -- -s dist

# Useful PM2 commands
pm2 status          # Check running processes
pm2 logs landing-kit  # View logs
pm2 restart landing-kit # Restart
pm2 stop landing-kit    # Stop
pm2 save            # Save process list for auto-restart on reboot
pm2 startup         # Generate startup script so PM2 launches on boot
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Locally preview the production build |

## License

This project is private.
