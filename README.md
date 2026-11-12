# Paper Crane

[![CI](https://github.com/Vethya/paper-crane/actions/workflows/ci.yaml/badge.svg?branch=dev)](https://github.com/Vethya/paper-crane/actions/workflows/ci.yaml) [![License: MIT](https://img.shields.io/badge/app%20license-MIT-blue.svg)](LICENSE)

A resume builder for generating elegant LaTeX resumes without writing any TeX code yourself.

Use the hosted app for free at [papercrane.vethya.com](https://papercrane.vethya.com).

https://github.com/user-attachments/assets/86d32a2a-a91f-4c2e-9335-c80e356958d6

## Features

- 🎨 **9 LaTeX templates:** Choose a design and build a polished resume.
- 👀 **Automatic PDF preview:** See your resume update as you edit, without leaving the builder.
- 📁 **Multiple resumes:** Keep different versions for different roles, and find them with search and tags.
- 🧩 **Reusable components:** Save experience, education, and other entries to copy into your resumes.
- 📥 **Take your work with you:** Download your resume as a PDF or export its LaTeX source for further editing.

Sign in to save multiple resumes and reusable components.

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
   git clone --branch dev https://github.com/Vethya/paper-crane.git
   cd paper-crane
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

## Templates

9 templates are included, each compiled with either `pdflatex` or `xelatex` depending on the template's requirements.

## Hosted and self-hosted

| | Hosted | Self-hosted |
| --- | --- | --- |
| **Best for** | Building a resume without managing infrastructure | Running your own instance and controlling its configuration |
| **Setup** | Open the app and start building | Run the Next.js app and configure MongoDB and Google OAuth |
| **Accounts and saved resumes** | Sign in with Google to save resumes | Configure your own Google OAuth client and MongoDB database |
| **Data storage** | Saved data is stored in the hosted app's database | Saved data is stored in the MongoDB database you configure |
| **PDF generation** | LaTeX compiles in your browser; the first preview downloads the runtime | Same browser-based compilation; no separate LaTeX server needed |
| **Resume Agent** | Disabled on the hosted app | Optional; enable it with a Gemini API key |
| **Maintenance** | No deployment or server maintenance required | You manage deployment, updates, database, and credentials |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute and report issues.

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
