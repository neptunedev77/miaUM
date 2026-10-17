import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Armazenamento de ficheiros. Para já em disco local (UPLOADS_DIR, um volume Docker em produção);
 * uma implementação S3 pode substituir esta sem mudar o resto do código (SPEC §5.4).
 */
export interface FileStorage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

/** As chaves são geradas pelo servidor; mesmo assim, nunca se aceita nada fora deste formato. */
const KEY_RE = /^[a-z]+\/[a-z0-9]{10,40}(-thumb)?\.webp$/;

function assertKey(key: string) {
  if (!KEY_RE.test(key)) throw new Error(`Chave de ficheiro inválida: ${key}`);
}

export class LocalFileStorage implements FileStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private file(key: string) {
    assertKey(key);
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Caminho fora da pasta de uploads");
    return full;
  }

  async put(key: string, data: Buffer) {
    const file = this.file(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
  }

  async get(key: string) {
    try {
      return await readFile(this.file(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string) {
    await rm(this.file(key), { force: true });
  }
}

export const storage: FileStorage = new LocalFileStorage(process.env.UPLOADS_DIR || "./uploads");
