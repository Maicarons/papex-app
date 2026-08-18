/**
 * PDF file cache (offline reading, P1) with LRU eviction.
 *
 * Files live in the app sandbox: Documents/papex-pdfs/{paperId}/{version}.pdf.
 * The *index* (metadata only) is kept in MMKV (docs §5.1). The actual bytes go
 * through a `FileStore` abstraction so the LRU logic is testable without native
 * file IO. Default limit is 2 GB (docs: memory known-issues).
 */
import { downloads as downloadsStore } from './mmkv';

export interface DownloadEntry {
  paperId: string;
  version: string;
  path: string; // relative path under the cache root
  size: number;
  status: 'pending' | 'downloading' | 'done' | 'error';
  createdAt: number;
  lastAccess: number;
}

/** Abstraction over the sandbox file system (injectable for tests). */
export interface FileStore {
  write(relPath: string, data: Uint8Array): Promise<void>;
  read(relPath: string): Promise<Uint8Array | null>;
  exists(relPath: string): Promise<boolean>;
  size(relPath: string): Promise<number>;
  remove(relPath: string): Promise<void>;
  list(): Promise<string[]>;
}

/** In-memory file store (tests / fallback when native FS is unavailable). */
export class MemoryFileStore implements FileStore {
  private files = new Map<string, Uint8Array>();
  async write(p: string, d: Uint8Array) {
    this.files.set(p, d);
  }
  async read(p: string) {
    return this.files.get(p) ?? null;
  }
  async exists(p: string) {
    return this.files.has(p);
  }
  async size(p: string) {
    return this.files.get(p)?.byteLength ?? 0;
  }
  async remove(p: string) {
    this.files.delete(p);
  }
  async list() {
    return Array.from(this.files.keys());
  }
}

export class PdfCache {
  private index: DownloadEntry[];
  private store: FileStore;

  constructor(
    private readonly maxBytes = 2 * 1024 * 1024 * 1024,
    store?: FileStore,
  ) {
    this.store = store ?? new MemoryFileStore();
    this.index = downloadsStore.getIndex<DownloadEntry>();
  }

  private persist(): void {
    downloadsStore.setIndex(this.index);
  }

  private relPath(paperId: string, version: string): string {
    return `papex-pdfs/${paperId}/${version}.pdf`;
  }

  async save(paperId: string, version: string, data: Uint8Array): Promise<DownloadEntry> {
    const path = this.relPath(paperId, version);
    await this.store.write(path, data);
    const size = await this.store.size(path);
    const now = Date.now();
    const entry: DownloadEntry = {
      paperId,
      version,
      path,
      size,
      status: 'done',
      createdAt: now,
      lastAccess: now,
    };
    this.index = this.index.filter((e) => !(e.paperId === paperId && e.version === version));
    this.index.push(entry);
    await this.evictIfNeeded();
    this.persist();
    return entry;
  }

  async get(paperId: string, version: string): Promise<Uint8Array | null> {
    const entry = this.index.find((e) => e.paperId === paperId && e.version === version);
    if (!entry) return null;
    const data = await this.store.read(entry.path);
    if (data) {
      entry.lastAccess = Date.now();
      this.persist();
    }
    return data;
  }

  has(paperId: string, version: string): boolean {
    return this.index.some((e) => e.paperId === paperId && e.version === version && e.status === 'done');
  }

  listEntries(): DownloadEntry[] {
    return [...this.index];
  }

  totalBytes(): number {
    return this.index.reduce((sum, e) => sum + (e.status === 'done' ? e.size : 0), 0);
  }

  /** Evict least-recently-used entries until under the cap. */
  async evictIfNeeded(): Promise<void> {
    let used = this.totalBytes();
    if (used <= this.maxBytes) return;
    const sorted = [...this.index].sort((a, b) => a.lastAccess - b.lastAccess);
    for (const e of sorted) {
      if (used <= this.maxBytes) break;
      await this.store.remove(e.path);
      used -= e.size;
      this.index = this.index.filter((x) => x !== e);
    }
    this.persist();
  }

  async remove(paperId: string, version: string): Promise<void> {
    const entry = this.index.find((e) => e.paperId === paperId && e.version === version);
    if (!entry) return;
    await this.store.remove(entry.path);
    this.index = this.index.filter((e) => e !== entry);
    this.persist();
  }
}

export const pdfCache = new PdfCache();
