export interface ScoreEntry {
  id?: number;
  username: string;
  email: string;
  score: number;
  date: string; // ISO 8601
}

const DB_NAME = 'block-dropper';
const DB_VERSION = 1;
const STORE_NAME = 'scores';

let cachedDb: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (cachedDb) return Promise.resolve(cachedDb);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { autoIncrement: true, keyPath: 'id' });
        store.createIndex('by_score', 'score', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      cachedDb = (event.target as IDBOpenDBRequest).result;
      resolve(cachedDb);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error?.message}`));
    };
  });
}

export async function getTopScores(n: number): Promise<ScoreEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('by_score');
    const request = index.openCursor(null, 'prev');
    const results: ScoreEntry[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor && results.length < n) {
        results.push(cursor.value as ScoreEntry);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to read scores: ${(event.target as IDBRequest).error?.message}`));
    };
  });
}

export async function saveScore(entry: Omit<ScoreEntry, 'id'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      reject(new Error(`Failed to save score: ${(event.target as IDBRequest).error?.message}`));
    };
  });
}

export async function qualifiesForTop(score: number, n: number): Promise<boolean> {
  const top = await getTopScores(n);
  if (top.length < n) return true;
  return score > (top[top.length - 1]?.score ?? 0);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString();
}

export function renderScoreboard(entries: ScoreEntry[]): void {
  const tbody = document.getElementById('scoreboard-list');
  if (!tbody) return;
  tbody.innerHTML = '';

  for (let i = 0; i < 3; i++) {
    const entry = entries[i];
    const tr = document.createElement('tr');
    if (entry) {
      tr.className = 'score-row';
      tr.innerHTML =
        `<td class="rank">${i + 1}</td>` +
        `<td class="username">${escapeHtml(entry.username)}</td>` +
        `<td class="score-value">${entry.score.toLocaleString()}</td>` +
        `<td class="date">${formatDate(entry.date)}</td>`;
    } else {
      tr.className = 'score-row empty';
      tr.innerHTML =
        `<td class="rank">${i + 1}</td>` +
        `<td class="username">\u2014</td>` +
        `<td class="score-value">\u2014</td>` +
        `<td class="date">\u2014</td>`;
    }
    tbody.appendChild(tr);
  }
}

export async function refreshScoreboard(n: number): Promise<void> {
  const entries = await getTopScores(n);
  renderScoreboard(entries);
}
