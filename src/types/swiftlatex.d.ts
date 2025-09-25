declare module 'swiftlatex' {
  export class PdfTeXEngine {
    constructor()
    loadEngine(): Promise<void>
    makeMemFSFolder(path: string): Promise<void>
    writeMemFSFile(filename: string, content: string | Uint8Array): Promise<void>
    setEngineMainFile(filename: string): Promise<void>
    compileLaTeX(): Promise<{ pdf: Uint8Array }>
    loadImageData(url: string): Promise<void>
    makeMemDownload(filename: string): string
  }

  export class XeTeXEngine {
    constructor()
    loadEngine(): Promise<void>
    makeMemFSFolder(path: string): Promise<void>
    writeMemFSFile(filename: string, content: string | Uint8Array): Promise<void>
    setEngineMainFile(filename: string): Promise<void>
    compileLaTeX(): Promise<{ pdf: Uint8Array }>
    loadImageData(url: string): Promise<void>
    makeMemDownload(filename: string): string
  }

  export class DvipdfmxEngine {
    constructor()
    loadEngine(): Promise<void>
    makeMemFSFolder(path: string): Promise<void>
    writeMemFSFile(filename: string, content: string | Uint8Array): Promise<void>
    setEngineMainFile(filename: string): Promise<void>
    compilePDF(): Promise<{ pdf: Uint8Array }>
    loadImageData(url: string): Promise<void>
    makeMemDownload(filename: string): string
  }
}
