<p align="center">
  <img src="../nascloud-icon.svg" alt="NasCloud" width="120">
</p>

<h1 align="center">NasCloud Frontend</h1>
<p align="center">The web client for your self-hosted NAS</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

## About

This is the web frontend for NasCloud, built with React 19 and Vite 8. It gives you a dark-themed file browser with a three-pane layout: a sidebar with a folder tree, a top toolbar, and a main file viewport. You can upload files (with drag and drop), download, rename, move, delete, search, share, and manage trash, all from your browser.

The frontend connects to the NasCloud Central Server to log in and discover your backend URL, then talks directly to your self-hosted NasCloud Backend for all file operations.

## Getting Started

```bash
cd Frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`.

## Configuration

Create a `.env` file in the Frontend root, or edit the existing one:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL of the NasCloud Central Server | `https://nascloud.onrender.com` |
| `VITE_FRONTEND_URL` | URL where this frontend is hosted | `http://localhost:5173` |
| `VITE_DOWNLOAD_SETUP_URL` | Download link for the Windows setup installer | GitHub releases URL |
| `VITE_DOWNLOAD_SERVER_URL` | Download link for the Windows server executable | GitHub releases URL |
| `VITE_GITHUB_URL` | Link to the GitHub repository | GitHub repo URL |

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run OxLint |

## Tech Stack

- React 19
- Vite 8
- React Router DOM 7
- Lucide React (icons)
- CSS Modules with CSS custom properties
- OxLint

## Related

- [NasCloud Backend](https://github.com/Naseer-fez/NasCloud-Backend) - The self-hosted file storage API
- [Central Server](../mainserver/README.md) - Authentication and URL resolution server

## License

This project is licensed under the MIT License.