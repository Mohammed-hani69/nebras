
import type { Store, AISettings, ModuleDefinition, GlobalSettings, WebTemplate, BlockDefinition, BuilderPlan } from '../types';

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

export const saveGlobalSettings = (settings: GlobalSettings): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not initialized');
    const transaction = db.transaction(STORES_OBJECT_STORE, 'readwrite');
    const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
    const request = objectStore.put({ id: 'global_settings', data: settings });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadGlobalSettings = (): Promise<GlobalSettings | null> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not initialized');
    const transaction = db.transaction(STORES_OBJECT_STORE, 'readonly');
    const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
    const request = objectStore.get('global_settings');
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
};

export const saveBuilderAssets = (templates: WebTemplate[], blocks: BlockDefinition[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction(STORES_OBJECT_STORE, 'readwrite');
        const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
        // Saving as separate keys to allow potential independent loading
        objectStore.put({ id: 'builder_templates', data: templates });
        objectStore.put({ id: 'builder_blocks', data: blocks });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const loadBuilderAssets = (): Promise<{ templates: WebTemplate[], blocks: BlockDefinition[] } | null> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction(STORES_OBJECT_STORE, 'readonly');
        const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
        
        const reqTemplates = objectStore.get('builder_templates');
        const reqBlocks = objectStore.get('builder_blocks');

        let templates: WebTemplate[] = [];
        let blocks: BlockDefinition[] = [];

        reqTemplates.onsuccess = () => {
            templates = reqTemplates.result?.data || [];
        };
        
        reqBlocks.onsuccess = () => {
            blocks = reqBlocks.result?.data || [];
        };

        transaction.oncomplete = () => {
            resolve({ templates, blocks });
        };
        
        transaction.onerror = () => {
             // If error, return nulls or empty
             resolve(null);
        };
    });
};

// --- Website Plans Persistence ---
export const saveWebsitePlans = (plans: BuilderPlan[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction(STORES_OBJECT_STORE, 'readwrite');
        const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
        const request = objectStore.put({ id: 'website_plans', data: plans });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadWebsitePlans = (): Promise<BuilderPlan[] | null> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction(STORES_OBJECT_STORE, 'readonly');
        const objectStore = transaction.objectStore(STORES_OBJECT_STORE);
        const request = objectStore.get('website_plans');
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
    });
};
