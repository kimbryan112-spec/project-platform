/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 3G: INTEGRATED SYNC ENGINE
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SYNC_STATES = {
        IDLE: 'idle',
        CHECKING: 'checking',
        SYNCING: 'syncing',
        COMPLETED: 'completed',
        FAILED: 'failed',
        PAUSED: 'paused'
    };

    class SyncEngineManager {
        constructor() {
            this.currentState = SYNC_STATES.IDLE;
            this.isEngineActive = false;
            this.db = window.KBLocalDB;
            this.queue = window.KBSyncQueue;
            this.conflictManager = window.KBConflictManager;

            this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('KBH_SYNC_CHANNEL') : null;
            this.isTabLeader = true;

            if (this.channel) {
                this.channel.onmessage = (event) => {
                    if (event.data && event.data.type === 'SYNC_STATUS') {
                        this.isTabLeader = !event.data.isLeader;
                    }
                };
            }

            this.eventListeners = {
                beforeSync: [],
                afterSync: [],
                syncSuccess: [],
                syncFailed: [],
                queueEmpty: []
            };

            this._recoverInterruptedSession();
            this._initTriggers();
        }

        getState() {
            return this.currentState;
        }

        _setState(newState) {
            const oldState = this.currentState;
            this.currentState = newState;
        }

        async _recoverInterruptedSession() {
            try {
                if (!this.queue) return;
                const items = await this.queue.getRawQueue ? await this.queue.getRawQueue() : [];
                for (const item of items) {
                    if (item.status === 'processing') {
                        item.status = 'pending';
                        await this.db.insert('pending_changes', item);
                    }
                }
            } catch (err) {}
        }

        async isCloudAvailable() {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch('/api/health', {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) return false;
                const data = await response.json();
                return data.status === 'healthy';
            } catch (err) {
                return false;
            }
        }

        _initTriggers() {
            window.addEventListener('online', () => this.startSync());
            window.addEventListener('focus', () => this.startSync());
            setTimeout(() => this.startSync(), 3000);
        }

        async startSync() {
            if (this.isEngineActive || this.currentState === SYNC_STATES.SYNCING) return;
            if (!this.isTabLeader) return;

            const available = await this.isCloudAvailable();
            if (!available) {
                this._setState(SYNC_STATES.PAUSED);
                return;
            }

            const pendingItems = await this.queue.getPendingQueue();
            if (pendingItems.length === 0) {
                this._setState(SYNC_STATES.IDLE);
                return;
            }

            this.isEngineActive = true;
            this._setState(SYNC_STATES.SYNCING);
            this._emit('beforeSync', { count: pendingItems.length });

            for (const item of pendingItems) {
                await this.queue.updateQueueStatus(item.id, 'processing');

                try {
                    // Idempotency payload inclusion
                    const response = await fetch(item.endpoint, {
                        method: item.method || 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'X-Operation-ID': item.operationId || item.id
                        },
                        body: JSON.stringify(item.payload)
                    });

                    if (response.status === 429 || response.status === 503) {
                        throw new Error("Cloudflare D1 quota limit reached.");
                    }

                    if (!response.ok) {
                        // Kung may conflict sa server, suriin gamit ang ConflictManager
                        if (response.status === 409 && this.conflictManager) {
                            const cloudData = await response.json().catch(() => null);
                            if (cloudData && cloudData.record) {
                                const resolution = this.conflictManager.resolveConflict(item.payload, cloudData.record, item.operation);
                                if (resolution.action === 'CLOUD_WINS') {
                                    console.warn('[SyncEngine] Conflict resolved: Cloud version prioritized.');
                                    await this.queue.removeQueueItem(item.id);
                                    continue;
                                }
                            }
                        }
                        throw new Error(`Server status ${response.status}`);
                    }

                    await this.queue.removeQueueItem(item.id);
                    this._emit('syncSuccess', { id: item.id, operation: item.operation });

                } catch (err) {
                    if (err.message.includes("quota") || err.message.includes("503")) {
                        await this.queue.updateQueueStatus(item.id, 'pending', err.message);
                        this._setState(SYNC_STATES.PAUSED);
                        this.isEngineActive = false;
                        return;
                    }

                    await this.queue.updateQueueStatus(item.id, 'failed', err.message);
                    this._setState(SYNC_STATES.FAILED);
                    this._emit('syncFailed', { id: item.id, error: err.message });
                    break;
                }
            }

            this.isEngineActive = false;
            const remaining = await this.queue.getQueueCount();
            if (remaining === 0) {
                this._setState(SYNC_STATES.COMPLETED);
                this._emit('queueEmpty', {});
                // STEP 6: Controlled refresh ng affected data nang hindi nire-reload ang buong page
                if (typeof window.loadProjects === 'function') {
                    window.loadProjects();
                }
            } else {
                this._setState(SYNC_STATES.IDLE);
            }
        }

        stopSync() {
            this.isEngineActive = false;
            this._setState(SYNC_STATES.IDLE);
        }

        on(eventName, callback) {
            if (this.eventListeners[eventName] && typeof callback === 'function') {
                this.eventListeners[eventName].push(callback);
            }
        }

        _emit(eventName, data) {
            if (this.eventListeners[eventName]) {
                this.eventListeners[eventName].forEach(cb => cb(data));
            }
        }
    }

    window.KBSyncEngine = new SyncEngineManager();

})(window);