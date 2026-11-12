# Third-party notices

The app code is MIT (see [LICENSE](LICENSE)). The LaTeX templates, classes, fonts and TeX packages listed here are not covered by that license. Each one keeps its own license, and the original notices stay in the files. Full license texts that must ship with the code are in [licenses/](licenses/).

## Exceptions to MIT

Two templates have terms that MIT does not allow. Check them before reusing this project commercially.

- **Template 3** is CC BY-NC-SA 2.5: no commercial use, and changed versions must keep the same license.
- **Template 5** uses `res.cls`, which may be copied only if the copies are not sold.

## Templates

| Template | Based on | Author | License | Source |
| --- | --- | --- | --- | --- |
| 1 | Unknown, probably the Rensselaer resume samples | Unknown | Unknown | — |
| 2 | Awesome CV | Claud D. Park (Byungjin Park) | Template: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). `awesome-cv.cls`: [LPPL 1.3c](https://www.latex-project.org/lppl/) | [posquit0/Awesome-CV](https://github.com/posquit0/Awesome-CV) |
| 3 | Scott Clark's resume | Scott Clark, based on work by Matthew Boedicker, David J. Grant and Nathaniel Johnston | [CC BY-NC-SA 2.5](https://creativecommons.org/licenses/by-nc-sa/2.5/) | [sc932/resume](https://github.com/sc932/resume) |
| 4 | Deedy Resume, changed to one column | Debarghya Das | [Apache-2.0](licenses/Apache-2.0.txt) | [deedy/Deedy-Resume](https://github.com/deedy/Deedy-Resume) |
| 5 | `res.cls` | Michael DeCorte | Copying allowed if not for resale and the notice is kept (see `res.cls`) | [Rensselaer resume samples](https://www.rpi.edu/dept/arc/training/latex/resumes/) |
| 6 | `minimal-resume.sty` | Ratul Saha | Unknown (original repo removed) | [RatulSaha](https://github.com/RatulSaha) |
| 7 | moderncv | Xavier Danaux | [LPPL 1.3c](https://www.latex-project.org/lppl/) | [moderncv/moderncv](https://github.com/moderncv/moderncv) |
| 8 | McDowell CV | Daniil Belyakov | MIT (notice in `mcdowellcv.cls`) | [dnl-blkv/mcdowell-cv](https://github.com/dnl-blkv/mcdowell-cv) |
| 9 | Your new CV | Frits Wenneker | Free to distribute if the credit to HowToTeX.com is kept | [Overleaf](https://www.overleaf.com/latex/templates/your-new-cv/xqzhcmqkqrtw) |

## Other bundled TeX files

| File | Author | License |
| --- | --- | --- |
| `template2/fontawesome.sty` | Claud D. Park, based on furl's latex-fontawesome | MIT ([posquit0/latex-fontawesome](https://github.com/posquit0/latex-fontawesome)) |
| `template5/helvetica.sty` | Sebastian Rahtz, changes by Harriet Borton (PSNFSS) | [LPPL](https://www.latex-project.org/lppl/) |
| `template7/tweaklist.sty` | Jakob Schiøtz, maintained by Xavier Danaux | [LPPL 1.3c](https://www.latex-project.org/lppl/) |

## Fonts

| Font | Used by | Copyright | License |
| --- | --- | --- | --- |
| FontAwesome 4 | Template 2 | Dave Gandy | [OFL-1.1](licenses/OFL-1.1.txt) |
| Roboto | Template 2 | Google | [Apache-2.0](licenses/Apache-2.0.txt) |
| Source Sans Pro | Template 2 | Adobe Systems Incorporated, Reserved Font Name "Source" | [OFL-1.1](licenses/OFL-1.1.txt) |
| Latin Modern Math | Template 2 | B. Jackowski, P. Strzelczyk, P. Pianowski (GUST) | [GUST Font License](licenses/GUST-Font-License.txt) |
| Raleway | Template 4 | Matt McInerney, Pablo Impallari, Rodrigo Fuenzalida | [OFL-1.1](licenses/OFL-1.1.txt) |
| Crimson Text | Template 6 | Sebastian Kosch, Reserved Font Name "Crimson Text" | [OFL-1.1](licenses/OFL-1.1.txt) |
| Montserrat | Template 6 | Julieta Ulanovsky, Reserved Font Name "Montserrat" | [OFL-1.1](licenses/OFL-1.1.txt) |

## TeX Live packages

`public/latex-packages/` holds packages copied from TeX Live 2025 by `scripts/build-latex-packages.mjs`. Licenses are from [CTAN](https://ctan.org/).

| License | Packages |
| --- | --- |
| [LPPL](https://www.latex-project.org/lppl/) | changepage, contract, everysel, footmisc, hyphenat, ifmtarg, isodate, koma-script, linegoal, makerobust, metalogo, ncctools, parskip, pdfcolmk, ragged2e, sectsty, setspace, substr, tabu, textpos, tipa, tocloft, varwidth, xcolor, xifthen, xltxtra, xpatch, xunicode, zref |
| MIT | enumitem, titlesec |
| [GPL-2.0](licenses/GPL-2.0.txt) | bigfoot |
| GPL ([GPL-2.0](licenses/GPL-2.0.txt) text) | helvetic (URW Nimbus Sans fonts, from urw-base35) |
| [OFL-1.1](licenses/OFL-1.1.txt) | marvosym |
| Free, with notice (see `framed.sty`) | framed |

## Other

| Component | License |
| --- | --- |
| `public/pdf.worker.min.mjs` (pdf.js, Mozilla Foundation) | [Apache-2.0](licenses/Apache-2.0.txt) |
