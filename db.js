const DB_NAME = 'FocusEkDB';
const DB_VERSION = 1;
let db;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject('Failed to open DB');
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'date' });
      }
    };
  });
}

export function saveTasks(allTasks) {
  // Store the entire allTasks object under a single key
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    store.put({ date: '__all__', tasks: allTasks, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject('Save failed');
  });
}

export function loadTasks() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const request = store.get('__all__');
    request.onsuccess = () => resolve(request.result?.tasks || {});
    request.onerror = () => reject('Load failed');
  });
}