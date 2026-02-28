"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const uuid_1 = require("uuid");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3027;
const TEMPLATES_DIR = (0, path_1.join)(__dirname, '..', 'templates');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use((0, cors_1.default)({
    origin: ALLOWED_ORIGIN,
    methods: ['POST']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.post('/compile', async (req, res) => {
    const { texDoc, opts } = req.body;
    if (!texDoc || !opts?.cmd) {
        res.status(400).send('Missing texDoc or opts.cmd');
        return;
    }
    const workDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), `resumake-${(0, uuid_1.v4)()}-`));
    try {
        // Copy all required input and font files into the work directory
        const assets = [...(opts.inputs || []), ...(opts.fonts || [])];
        for (const assetPath of assets) {
            // assetPath is like /templates/template2/awesome-cv.cls
            // strip leading slash and resolve against TEMPLATES_DIR
            const relative = assetPath.replace(/^\/templates\//, '');
            const src = (0, path_1.join)(TEMPLATES_DIR, relative);
            const dest = (0, path_1.join)(workDir, (0, path_1.basename)(assetPath));
            if (!(0, fs_1.existsSync)(src)) {
                res.status(500).send(`Template asset not found: ${assetPath}`);
                return;
            }
            await (0, promises_1.copyFile)(src, dest);
        }
        // For xelatex, fonts also need to be in a fonts/ subdir (some .cls files look there)
        if (opts.cmd === 'xelatex' && opts.fonts && opts.fonts.length > 0) {
            await (0, promises_1.mkdir)((0, path_1.join)(workDir, 'fonts'), { recursive: true });
            for (const fontPath of opts.fonts) {
                const relative = fontPath.replace(/^\/templates\//, '');
                const src = (0, path_1.join)(TEMPLATES_DIR, relative);
                const dest = (0, path_1.join)(workDir, 'fonts', (0, path_1.basename)(fontPath));
                if ((0, fs_1.existsSync)(src)) {
                    await (0, promises_1.copyFile)(src, dest);
                }
            }
        }
        await (0, promises_1.writeFile)((0, path_1.join)(workDir, 'main.tex'), texDoc, 'utf-8');
        const latexArgs = [
            '-interaction=nonstopmode',
            '-no-shell-escape',
            '-output-directory',
            workDir,
            'main.tex'
        ];
        await execFileAsync(opts.cmd, latexArgs, {
            cwd: workDir,
            timeout: 60000
        });
        const pdfPath = (0, path_1.join)(workDir, 'main.pdf');
        if (!(0, fs_1.existsSync)(pdfPath)) {
            res.status(500).send('Compilation produced no output PDF');
            return;
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(pdfPath);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).send(`Compilation error: ${message}`);
    }
    finally {
        (0, promises_1.rm)(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
});
app.listen(PORT, () => {
    console.log(`LaTeX API listening on port ${PORT}`);
});
