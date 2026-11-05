# Resume Manager

A resume builder for generating elegant LaTeX resumes without writing any TeX code yourself. Built with Next.js and client-side WebAssembly LaTeX compilation.

## Features

- **Visual template picker** — choose from 9 LaTeX templates with live previews
- **Live PDF preview** — see your resume update in real time with zoom, pagination, and download controls
- **Dynamic form sections** — add and remove entries for experience, education, projects, skills, and more
- **LaTeX special character sanitization** — user input is automatically escaped before compilation
- **Responsive layout** — tab-based UI on mobile/tablet, side-by-side on desktop

## Tech Stack

**Frontend**
- Next.js 15, React 19, TypeScript
- Tailwind CSS, Jotai, react-pdf, react-hook-form

**LaTeX compilation**
- Siglum Engine with TeX Live 2025 compiled to WebAssembly
- Runs in the browser with no LaTeX server required

## Architecture

The app runs as one Next.js service:

| Service | Port | Description |
|---|---|---|
| Next.js app | 3026 | UI, authentication, data APIs, and browser-side PDF compilation |

The browser downloads the Siglum WebAssembly runtime and compiles generated `.tex` documents locally. The first compilation downloads the runtime bundles; subsequent compilations reuse the browser cache.

## Getting Started

**Install dependencies**

```bash
pnpm install
```

**Run the frontend**

```bash
pnpm dev
```

**Environment**

Create a `.env.local` in the project root with the app's existing authentication, database, and AI settings. No LaTeX API URL is required.

The generator route sends the headers required by WebAssembly threading (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`).

## Templates

9 templates are included, each compiled with either `pdflatex` or `xelatex` depending on the template's requirements.

## Credits

Thanks to the creators of the LaTeX templates used in this project.

- [Rensselaer Career Development Center](https://www.rpi.edu/dept/arc/training/latex/resumes/)
- [Byungjin Park](https://github.com/posquit0)
- [Scott Clark](https://github.com/sc932)
- [Debarghya Das](https://github.com/deedy)
- [Xavier Danaux](https://github.com/xdanaux)
- [Ratul Saha](https://github.com/RatulSaha)
- [Daniil Belyakov](https://github.com/dnl-blkv)
- [Frits Wenneker](https://www.overleaf.com/latex/templates/your-new-cv/xqzhcmqkqrtw), via [HowToTeX.com](http://www.howtotex.com/)

## Licenses

The app code is MIT. It is based on [Resumake](https://github.com/saadq/resumake.io) by Saad Quadri, whose copyright notice is kept in [LICENSE](LICENSE).

The templates, LaTeX classes, fonts and bundled TeX packages keep their own licenses. Two templates are exceptions to MIT:

- Template 3 is CC BY-NC-SA 2.5 (no commercial use).
- Template 5 uses `res.cls`, which may not be sold.

[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) lists the author, license and source of each one.
