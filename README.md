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
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD automated deployment workflow
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

## CI/CD — Automated Deployment

The project includes a **GitHub Actions** workflow (`.github/workflows/deploy.yml`) that automatically deploys to the production server whenever a pull request is merged into the `deploy` branch.

### How it works

```
PR merged into `deploy` ──▶ GitHub Actions triggered ──▶ SSH into server ──▶ Build & deploy
```

1. **Trigger** — The workflow runs when a pull request targeting the `deploy` branch is **closed and merged**.
2. **Build verification** — On the GitHub Actions runner (Ubuntu), the workflow checks out the code, sets up **Node.js 20**, installs dependencies (`npm ci`), and runs `npm run build` to verify the project compiles correctly.
3. **Production deployment** — Using SSH (via [`appleboy/ssh-action`](https://github.com/appleboy/ssh-action)), the workflow connects to the production server and executes:
   ```bash
   cd <PRODUCTION_PATH>
   git pull origin deploy
   npm ci
   npm run build
   ```

### Required repository secrets

The following secrets must be configured in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `PRODUCTION_HOST` | Hostname or IP address of the production server |
| `PRODUCTION_USER` | SSH username on the production server |
| `SSH_PRIVATE_KEY` | Private SSH key authorized on the server |
| `PRODUCTION_PATH` | Absolute path to the project directory on the server |

### Deployment flow

```
feature/work branch ──(merged PR into deploy)──▶ deploy branch ──▶ GitHub Actions ──▶ Production server
```

> **Note:** Only **merged** pull requests trigger the deployment. Closed-without-merge PRs are ignored.

## Production Deployment (Manual)

Because the build output is a set of **static files** (`dist/`), you can serve them with any web server (Nginx, Apache, Caddy, a CDN, etc.).

### Serving with a simple Node.js static server

```bash
# Install a lightweight static server globally (one-time)
npm install -g serve

# Serve the production build
serve -s dist
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Locally preview the production build |

Test deploy 01
