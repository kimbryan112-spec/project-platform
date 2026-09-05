/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 3A: LOCAL DATABASE FOUNDATION (IndexedDB)
 * ============================================================================
 * Objective: 
 * Provides a robust, generic IndexedDB foundation for future offline capabilities.
 * This file is purely foundational and does NOT intercept fetches, sync with D1,
 * or alter the current application behavior.
 * 
 * Database Name: KBHFILMS_LOCAL
 * Version: 1
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DB_NAME = 'KBHFILMS_LOCAL';
    const DB_VERSION = 1;
    
    // Object Stores na nakasaad sa kinakailangan
    const STORE_NAMES = [
        'projects',
        'pending_changes',
        'settings',
        'notifications',
        'users_cache',
        'sessions',
        'activity_logs',
        'music_cache'
    ];

    class LocalDatabaseManager {
        constructor() {
            this.dbInstance = null;
            this.isSupported = typeof indexedDB !== 'undefined';
        }

        /**
         * STEP 1 & 5: Open Database with Version Upgrade Support
         * Nagbubukas ng IndexedDB connection at gumagawa ng object stores kung kinakailangan.
         * Tinitiyak na hindi mawawala ang lumang data sakaling mag-upgrade ng bersyon sa hinaharap.
         * @returns {Promise<IDBDatabase>}
         */
        async open() {
            if (!this.isSupported) {
                console.warn('[LocalDB] IndexedDB is not supported in this environment.');
                return null;
            }

            if (this.dbInstance) {
                return this.dbInstance;
            }

            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    console.log('[LocalDB] Upgrading IndexedDB schema...');

                    STORE_NAMES.forEach(storeName => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            // Gumagamit ng 'id' o 'key' bilang keyPath depende sa store kung kinakailangan, 
                            // o autoIncrement para sa flexibility.
                            if (storeName === 'projects') {
                                db.createObjectStore(storeName, { keyPath: 'rowId' });
                            } else if (storeName === 'pending_changes' || storeName === 'activity_logs') {
                                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            } else {
                                db.createObjectStore(storeName, { keyPath: 'key' });
                            }
                            console.log(`[LocalDB] Object store created: ${storeName}`);
                        }
                    });
                };

                request.onsuccess = (event) => {
                    this.dbInstance = event.target.result;
                    resolve(this.dbInstance);
                };

                request.onerror = (event) => {
                    console.error('[LocalDB] Error opening IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
            });
        }

        /**
         * Generic Helper: Get a single record by primary key
         * @param {string} storeName 
         * @param {IDBValidKey} key 
         * @returns {Promise<any>}
         */
        async get(storeName, key) {
            try {
                const db = await this.open();
                if (!db) return null;

                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(key);

                    request.onsuccess = () => resolve(request.result || null);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error(`[LocalDB] Get error in ${storeName}:`, error);
                return null; // STEP 6: Safe error handling
            }
        }

        /**
         * Generic Helper: Get all records from a store
         * @param {string} storeName 
         * @returns {Promise<Array>}
         */
        async getAll(storeName) {
            try {
                const db = await this.open();
                if (!db) return [];

                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();

                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error(`[LocalDB] GetAll error in ${storeName}:`, error);
                return []; // STEP 6: Safe error handling
            }
        }

        /**
         * Generic Helper: Insert or update a record (put)
         * @param {string} storeName 
         * @param {Object} value 
         * @returns {Promise<any>}
         */
        async insert(storeName, value) {
            try {
                const db = await this.open();
                if (!db) return null;

                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.put(value);

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error(`[LocalDB] Insert error in ${storeName}:`, error);
                return null;
            }
        }

        /**
         * Generic Helper: Update record explicitly (kapareho ng insert/put sa indexeddb, ngunit hiwalay para sa semantic clarity)
         * @param {string} storeName 
         * @param {Object} value 
         * @returns {Promise<any>}
         */
        async update(storeName, value) {
            return this.insert(storeName, value);
        }

        /**
         * Generic Helper: Delete a record by primary key
         * @param {string} storeName 
         * @param {IDBValidKey} key 
         * @returns {Promise<boolean>}
         */
        async delete(storeName, key) {
            try {
                const db = await this.open();
                if (!db) return false;

                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(key);

                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error(`[LocalDB] Delete error in ${storeName}:`, error);
                return false;
            }
        }

        /**
         * Generic Helper: Clear all records in a store
         * @param {string} storeName 
         * @returns {Promise<boolean>}
         */
        async clear(storeName) {
            try {
                const db = await this.open();
                if (!db) return false;

                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();

                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error(`[LocalDB] Clear error in ${storeName}:`, error);
                return false;
            }
        }
    }

    // Expose globally as window.KBLocalDB para magamit sa hinaharap na mga yugto
    window.KBLocalDB = new LocalDatabaseManager();

})(window);