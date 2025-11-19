
import type { Store, AISettings, ModuleDefinition } from '../types';

const DB_NAME = 'MobileShopDB';
const DB_VERSION = 2; // Incremented version
const STORES_OBJECT_STORE = 'stores';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject(false);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORES_OBJECT_STORE)) {
        dbInstance.createObjectStore(STORES_OBJECT_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveStores = (stores: Store[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject('DB not initialized');
    }
    try {
      const transaction = db.transaction(STORES_OBJECT_STORE, 'readwrite');
      const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
      
      const request = objectStore.put({ id: 'all_stores', data: stores });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error saving stores:', request.error);
        reject(request.error);
      };
    } catch (error) {
      console.error("Transaction error on save:", error);
      reject(error);
    }
  });
};

export const loadStores = (): Promise<Store[] | null> => {
  return new Promise((resolve, reject) => {
     if (!db) {
      return reject('DB not initialized');
    }
    try {
        const transaction = db.transaction(STORES_OBJECT_STORE, 'readonly');
        const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
        const request = objectStore.get('all_stores');

        request.onsuccess = () => {
          if (request.result && request.result.data) {
            resolve(request.result.data);
          } else {
            resolve(null); // No data found
          }
        };

        request.onerror = () => {
          console.error('Error loading stores:', request.error);
          reject(request.error);
        };
    } catch (error) {
      console.error("Transaction error on load:", error);
      reject(error);
    }
  });
};

export const saveAISettings = (settings: AISettings): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject('DB not initialized');
    }
    const transaction = db.transaction(STORES_OBJECT_STORE, 'readwrite');
    const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
    const request = objectStore.put({ id: 'ai_settings', data: settings });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadAISettings = (): Promise<AISettings | null> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject('DB not initialized');
    }
    const transaction = db.transaction(STORES_OBJECT_STORE, 'readonly');
    const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
    const request = objectStore.get('ai_settings');
    request.onsuccess = () => {
        resolve(request.result?.data || null);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveMarketplaceSettings = (modules: ModuleDefinition[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction(STORES_OBJECT_STORE, 'readwrite');
        const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
        const request = objectStore.put({ id: 'marketplace_settings', data: modules });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadMarketplaceSettings = (): Promise<ModuleDefinition[] | null> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction(STORES_OBJECT_STORE, 'readonly');
        const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
        const request = objectStore.get('marketplace_settings');
        request.onsuccess = () => {
            resolve(request.result?.data || null);
        };
        request.onerror = () => reject(request.error);
    });
};
