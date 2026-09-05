/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 3E: OFFLINE MODE CONTROLLER
 * ============================================================================
 * Objective:
 * Centralized Offline Mode Controller that automatically manages application states
 * (ONLINE, OFFLINE, SYNCING, RECOVERY) without altering UI, layouts, or business logic.
 * ============================================================================
 */

(function (window) {
    'use strict';

    // STEP 2: Internal Application States
    const MODES = {
        ONLINE: 'ONLINE',
        OFFLINE: 'OFFLINE',
        SYNCING: 'SYNCING',
        RECOVERY: 'RECOVERY'
    };

    class OfflineModeController {
        constructor() {
            this.currentMode = MODES.ONLINE;
            this.syncEngine = window.KBSyncEngine;
            this.queue = window.KBSyncQueue;
            
            // STEP 7: Centralized event listeners registry para sa mode changes
            this.listeners = [];

            // STEP 8: Multi-tab coordination gamit ang BroadcastChannel
            this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('KBH_MODE_CHANNEL') : null;
            this.isLeader = true;

            if (this.channel) {
                this.channel.onmessage = (event) => {
                    if (event.data && event.data.type === 'MODE_UPDATE') {
                        this._setModeInternal(event.data.mode, false);
                    }
                };
            }

            this._initMonitoring();
        }

        /**
         * STEP 6: Reusable Helper Functions
         */
        getCurrentMode() {
            return this.currentMode;
        }

        isOnlineMode() {
            return this.currentMode === MODES.ONLINE;
        }

        isOfflineMode() {
            return this.currentMode === MODES.OFFLINE;
        }

        isSyncing() {
            return this.currentMode === MODES.SYNCING;
        }

        isRecovery() {
            return this.currentMode === MODES.RECOVERY;
        }

        /**
         * STEP 7: Event Subscription Architecture
         */
        subscribe(callback) {
            if (typeof callback === 'function') {
                this.listeners.push(callback);
            }
        }

        _notifyListeners(newMode, oldMode, reason) {
            this.listeners.forEach(cb => {
                try {
                    cb({ mode: newMode, previousMode: oldMode, reason: reason, timestamp: Date.now() });
                } catch (err) {
                    console.error('[OfflineController] Error in listener callback:', err);
                }
            });
        }

        _setModeInternal(newMode, broadcast = true) {
            if (this.currentMode === newMode) return;
            const oldMode = this.currentMode;
            this.currentMode = newMode;

            // STEP 11: Temporary Debug Logging
            console.debug(`[OfflineController Mode Change] ${oldMode} ➔ ${newMode}`);

            if (broadcast && this.channel) {
                this.channel.postMessage({ type: 'MODE_UPDATE', mode: newMode });
            }

            this._notifyListeners(newMode, oldMode, 'Internal state transition');
        }

        /**
         * STEP 3 & 10: Mode Detection Strategy (Cloud Health + Browser Events + Sync Status)
         */
        async evaluateNetworkState() {
            // STEP 3 Rule: Never rely only on navigator.onLine
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                this._setModeInternal(MODES.OFFLINE);
                return;
            }

            if (this.syncEngine && typeof this.syncEngine.isCloudAvailable === 'function') {
                const cloudActive = await this.syncEngine.isCloudAvailable();
                const pendingCount = this.queue ? await this.queue.getQueueCount() : 0;

                if (!cloudActive) {
                    // STEP 4: Pag nawala ang cloud, lumipat sa LOCAL MODE nang walang reload
                    this._setModeInternal(MODES.OFFLINE);
                } else {
                    // STEP 5 & 10: Kung bumalik ang cloud pero may pending queue pa, mag-sync muna bago mag-ONLINE
                    if (pendingCount > 0) {
                        this._setModeInternal(MODES.SYNCING);
                        await this.syncEngine.startSync();
                        
                        const remaining = await this.queue.getQueueCount();
                        if (remaining === 0) {
                            this._setModeInternal(MODES.ONLINE);
                        } else {
                            // Kung nabigo o may naiwan pa
                            this._setModeInternal(MODES.OFFLINE);
                        }
                    } else {
                        this._setModeInternal(MODES.ONLINE);
                    }
                }
            }
        }

        /**
         * STEP 3 & 7: Automated Background Evaluator Triggers
         */
        _initMonitoring() {
            window.addEventListener('online', () => {
                this.evaluateNetworkState();
            });

            window.addEventListener('offline', () => {
                this._setModeInternal(MODES.OFFLINE);
            });

            // Regular na pagsusuri tuwing babalik ang focus sa app
            window.addEventListener('focus', () => {
                this.evaluateNetworkState();
            });

            // Perpektong panimulang pagsusuri pagkaload ng script
            setTimeout(() => {
                this.evaluateNetworkState();
            }, 2000);
        }
    }

    // Expose globally as window.KBOfflineController
    window.KBOfflineController = new OfflineModeController();

})(window);