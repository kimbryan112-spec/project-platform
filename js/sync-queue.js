/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 3B: PENDING CHANGES QUEUE (Sync Queue Manager)
 * ============================================================================
 * Objective:
 * Creates a local queue layer inside the existing IndexedDB 'pending_changes' 
 * store to record every database-changing operation while offline or when D1 is unavailable.
 * 
 * This file is purely foundational for queuing. 
 * NO synchronization, NO fetch interception, NO D1 calls, and NO UI changes are performed here.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const STORE_NAME = 'pending_changes';

    class SyncQueueManager {
        constructor() {
            // Nakadepende sa KBLocalDB mula sa Stage 3A
            this.db = window.KBLocalDB;
        }

        /**
         * STEP 4 & 6: Add Item to Queue with Duplicate Prevention (Merging Strategy)
         * Nagdaragdag o nag-a-update ng pending operation sa FIFO order.
         * Kung ang parehong operation at endpoint/target ID ay umiiral na, 
         * pinagsasama o nire-replace nito ang payload para maiwasan ang duplicate queue entries.
         * 
         * @param {string} operation - Hal. 'UPDATE_PROJECT', 'CREATE_PROJECT', etc.
         * @param {string} endpoint - API endpoint route
         * @param {string} method - 'POST', 'PUT', 'DELETE', etc.
         * @param {Object} payload - Ang data na isi-sync sa hinaharap
         * @returns {Promise<number|null>} - Nagbabalik ng queue item ID
         */
        async addQueueItem(operation, endpoint, method, payload) {
            try {
                if (!this.db) {
                    console.warn('[SyncQueue] KBLocalDB is not initialized.');
                    return null;
                }

                // Kunin ang kasalukuyang queue para sa duplicate prevention check
                const existingQueue = await this.getPendingQueue();
                const now = new Date().toISOString();

                // STEP 6: Duplicate Prevention / Merging Strategy
                // Halimbawa: Kung ang operasyon ay update para sa parehong endpoint/payload identifier,
                // i-update na lamang ang umiiral na pending item sa halip na magdagdag ng bago.
                const duplicateIndex = existingQueue.findIndex(item => 
                    item.operation === operation && 
                    item.endpoint === endpoint && 
                    item.status === 'pending'
                );

                if (duplicateIndex !== -1) {
                    const existingItem = existingQueue[duplicateIndex];
                    existingItem.payload = payload; // Palitan ng pinakabagong payload
                    existingItem.updatedAt = now;
                    // Panatilihin ang retryMetadata at retryCount mula sa dati
                    
                    await this.db.insert(STORE_NAME, existingItem);
                    console.log(`[SyncQueue] Merged duplicate queue item for operation: ${operation} at ${endpoint}`);
                    return existingItem.id;
                }

                // STEP 4: Standard Queue Record Structure
                const queueItem = {
                    operation: operation,       // Hal. 'UPDATE_PROJECT', 'RESET_MONTH', etc.
                    endpoint: endpoint,         // API route
                    method: method,             // HTTP Method
                    payload: payload,           // Data payload
                    createdAt: now,             // Oras ng paggawa
                    updatedAt: now,             // Huling binago
                    status: 'pending',          // 'pending' | 'processing' | 'completed' | 'failed'
                    // STEP 7: Retry Metadata Structure (Walang retries pa sa yugtong ito)
                    retryCount: 0,
                    lastAttempt: null,
                    lastError: null
                };

                const recordId = await this.db.insert(STORE_NAME, queueItem);
                console.log(`[SyncQueue] Added item to queue [ID: ${recordId}]: ${operation}`);
                return recordId;

            } catch (error) {
                console.error('[SyncQueue] Error adding item to queue:', error);
                return null; // STEP 9: Safe error handling
            }
        }

        /**
         * STEP 3 & 8: Get Pending Queue sorted in FIFO (First-In, First-Out) order
         * Kinukuha ang lahat ng nakapending na operasyon kung saan ang pinakaluma 
         * ang nauuna (FIFO strategy).
         * @returns {Promise<Array>}
         */
        async getPendingQueue() {
            try {
                if (!this.db) return [];
                const allItems = await this.db.getAll(STORE_NAME);

                // I-filter lamang ang mga 'pending' o 'failed' at i-sort ayon sacreatedAt (FIFO)
                const pendingItems = allItems.filter(item => item.status === 'pending' || item.status === 'failed');
                
                pendingItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                return pendingItems;
            } catch (error) {
                console.error('[SyncQueue] Error fetching pending queue:', error);
                return [];
            }
        }

        /**
         * STEP 3: Get total count of pending queue items
         * @returns {Promise<number>}
         */
        async getQueueCount() {
            const pending = await this.getPendingQueue();
            return pending.length;
        }

        /**
         * STEP 3: Remove a specific queue item by its primary key ID
         * @param {number} id 
         * @returns {Promise<boolean>}
         */
        async removeQueueItem(id) {
            try {
                if (!this.db) return false;
                return await this.db.delete(STORE_NAME, id);
            } catch (error) {
                console.error(`[SyncQueue] Error removing queue item ID ${id}:`, error);
                return false;
            }
        }

        /**
         * STEP 3: Clear the entire queue store
         * @returns {Promise<boolean>}
         */
        async clearQueue() {
            try {
                if (!this.db) return false;
                return await this.db.clear(STORE_NAME);
            } catch (error) {
                console.error('[SyncQueue] Error clearing queue:', error);
                return false;
            }
        }

        /**
         * STEP 3 & 7: Mark item as synced (completed) or update its retry metadata
         * Ginagamit sa hinaharap kapag may sync engine na.
         * 
         * @param {number} id 
         * @param {string} status - 'completed' | 'failed' | 'processing'
         * @param {string|null} errorMsg - Optional error message kung nabigo
         */
        async updateQueueStatus(id, status, errorMsg = null) {
            try {
                if (!this.db) return false;
                const item = await this.db.get(STORE_NAME, id);
                if (!item) return false;

                item.status = status;
                item.updatedAt = new Date().toISOString();
                
                if (status === 'failed') {
                    item.retryCount = (item.retryCount || 0) + 1;
                    item.lastAttempt = new Date().toISOString();
                    item.lastError = errorMsg;
                }

                await this.db.insert(STORE_NAME, item);
                return true;
            } catch (error) {
                console.error(`[SyncQueue] Error updating queue status for ID ${id}:`, error);
                return false;
            }
        }
    }

    // STEP 5: Supported Operations Reference (Documentation / Future Extension Point)
    // Ang mga sumusunod na operations ang susuportahan sa hinaharap na mga yugto:
    /*
        SUPPORTED_OPERATIONS = {
            CREATE_PROJECT: 'CREATE_PROJECT',
            UPDATE_PROJECT: 'UPDATE_PROJECT',
            DELETE_PROJECT: 'DELETE_PROJECT',
            RESTORE_PROJECT: 'RESTORE_PROJECT',
            RESET_MONTH: 'RESET_MONTH',
            RESET_YEAR: 'RESET_YEAR',
            UPDATE_SETTINGS: 'UPDATE_SETTINGS',
            NOTIFICATION_READ: 'NOTIFICATION_READ',
            LOGS: 'LOGS',
            MUSIC_CACHE: 'MUSIC_CACHE'
        };
    */

    // Expose globally as window.KBSyncQueue para magamit sa hinaharap
    window.KBSyncQueue = new SyncQueueManager();

})(window);