# Resume Manager

A resume builder for generating elegant LaTeX resumes without writing any TeX code yourself. Built as a modern full-stack rebuild with a Next.js frontend and a dedicated LaTeX compilation API backend.

## Features

- **Visual template picker** — choose from 6 LaTeX templates with live previews
- **Live PDF preview** — see your resume update in real time with zoom, pagination, and download controls
- **Dynamic form sections** — add and remove entries for experience, education, projects, skills, and more
- **LaTeX special character sanitization** — user input is automatically escaped before compilation
- **Responsive layout** — tab-based UI on mobile/tablet, side-by-side on desktop

## Tech Stack

**Frontend**
- Next.js 15, React 19, TypeScript
- Tailwind CSS, Jotai, react-pdf, react-hook-form

**Backend (LaTeX API)**
- Express.js with `pdflatex` / `xelatex`
- Runs standalone or via Docker

## Architecture

The project is split into two services:

| Service | Port | Description |
|---|---|---|
| Next.js app | 3026 | Frontend UI — form, preview, template selection |
| `latex-api` | 3027 | Express server — receives `.tex` source, compiles with LaTeX, returns a PDF |

The frontend sends the generated `.tex` document to the API, which compiles it in an isolated temp directory and streams the resulting PDF back.

## Getting Started

**Install dependencies**

```bash
pnpm install
cd latex-api && pnpm install
```

**Run the frontend**

```bash
pnpm dev
```

**Run the LaTeX API** (requires a local LaTeX installation — `texlive-xetex`, `texlive-latex-extra`, etc.)

```bash
cd latex-api && pnpm dev
```

**Or run the LaTeX API via Docker** (recommended — includes all LaTeX packages)

```bash
docker build -f latex-api/Dockerfile -t resumake-latex-api .
docker run -p 3027:3027 resumake-latex-api
```

**Environment**

Create a `.env.local` in the project root and set the API URL:

```
NEXT_PUBLIC_LATEX_API_URL=http://localhost:3027
```

## Templates

6 templates are included, each compiled with either `pdflatex` or `xelatex` depending on the template's requirements.

## Credits

Thanks to the creators of the LaTeX templates used in this project.

- [Rensselaer Career Development Center](https://www.rpi.edu/dept/arc/training/latex/resumes/)
- [Byungjin Park](https://github.com/posquit0)
- [Scott Clark](https://github.com/sc932)
- [Debarghya Das](https://github.com/deedy)
- [Xavier Danaux](https://github.com/xdanaux)
- [Ratul Saha](https://github.com/RatulSaha)
- [Daniil Belyakov](https://github.com/dnl-blkv)
- [Frits Wenneker](https://www.overleaf.com/latex/templates/your-new-cv/xqzhcmqkqrtw)
