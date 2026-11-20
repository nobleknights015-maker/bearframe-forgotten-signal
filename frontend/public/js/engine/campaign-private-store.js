// Local-only browser IndexedDB cache for owner-imported private Director's Cut v2 campaign JSON.
// Private story payloads remain strictly on the user's device and are never transmitted or committed.

const DB_NAME = 'bearframe_aeon_private_install_v1';
const STORE = 'bundles';
const KEY = 'directors_cut_v2';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB unavailable'));
  });
}

export async function loadLocalPrivateCampaign() {
  try {
    const db = await openDb();
    if (!db) return null;
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveLocalPrivateCampaign({ content, world }) {
  const db = await openDb();
  if (!db) throw new Error('Browser storage unavailable for private campaign install');
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      savedAt: new Date().toISOString(),
      content,
      world
    }, KEY);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('Failed to store private campaign locally'));
  });
}

export async function clearLocalPrivateCampaign() {
  const db = await openDb();
  if (!db) return false;
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('Failed to clear local campaign install'));
  });
}
