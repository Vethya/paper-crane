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

For local development, [set up MongoDB](docs/local-mongodb.md) before starting the app.

## Getting Started

1. Install Node.js. CI uses Node 20, and the MongoDB driver needs at least Node 20.19 on that release line.
2. Clone the development branch:

   ```bash
   git clone --branch dev https://github.com/Vethya/resume-manager.git
   cd resume-manager
   ```

3. [Install pnpm](https://pnpm.io/10.x/installation). From the project directory, check that `pnpm --version` matches `packageManager` in [package.json](package.json). Install dependencies with `pnpm install --frozen-lockfile`.

4. Follow the environment setup below, then run `pnpm dev`.
5. Open the [local generator](http://localhost:3026/generator), enter a sample name, and select **Render**. Check that the PDF appears in **Preview**. The first preview downloads the browser's LaTeX runtime.

### Environment

Copy the example into a local environment file:

```bash
cp .env.local.example .env.local
```

The app requires these five values at startup:

| Variable | Local value |
| --- | --- |
| `MONGODB_URI` | The connection string for your development database. Use a MongoDB replica set for tag rename and delete. |
| `BETTER_AUTH_URL` | `http://localhost:3026` |
| `BETTER_AUTH_SECRET` | Generate a value with `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` | The client ID from your Google OAuth Web application. |
| `GOOGLE_CLIENT_SECRET` | The client secret from the same OAuth client. |

In [Google Auth Platform](https://console.cloud.google.com/auth/clients), create an OAuth client with application type **Web application**. Add `http://localhost:3026/api/auth/callback/google` to **Authorized redirect URIs**. If the app is in testing mode, add your Google account as a test user. Open the app using the same host and port as `BETTER_AUTH_URL` and check that **Continue with Google** takes you to **Resumes**.

Keep credentials in `.env.local`. The example file is for placeholders. PDF compilation runs in the browser.

**AI features**

`AI_FEATURES_ENABLED` defaults to `false`. The hosted site runs with the Resume Agent off. To enable it when you self-host, set both variables:

```bash
AI_FEATURES_ENABLED=true
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
```

The server reads the flag at runtime, so with `next start` changing it takes a restart, not a rebuild. On Vercel, env changes apply only to new deployments, so redeploy after changing it. If the flag is on and the key is missing, the server fails at startup. When the flag is off, the agent UI is hidden and the agent API routes return 404. `/api/agent/status` reports whether the flag is on.

When AI is enabled, resume data and conversation messages are sent to Google Gemini. Saved chat history is stored in MongoDB in `agentSession`. AI requests allow 64,000 characters of serialized resume JSON, 32,000 per message, and 128,000 across the resume and message content, counted as Unicode code points. Older complete exchanges are left out when necessary; saved history stays intact. Warnings appear at 80% of a limit. Oversized resumes and new messages must be shortened. A separate 768,000-byte transport cap protects the server before JSON parsing. Chat output is capped at 2,048 tokens; editing and its single repair attempt each allow 8,192. Incomplete edits are never applied.

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
