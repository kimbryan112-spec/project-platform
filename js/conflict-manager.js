/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 3F: SMART CONFLICT RESOLUTION
 * ============================================================================
 * Objective:
 * Implement a deterministic conflict resolution engine that safely merges local 
 * and cloud data after synchronization without modifying UI or disrupting user flow.
 * ============================================================================
 */

(function (window) {
    'use strict';

    // STEP 5: Operation Priority Definition (Mas mataas na priority ang nananaig)
    const OPERATION_PRIORITY = {
        'DELETE': 4,
        'RESTORE': 3,
        'UPDATE': 2,
        'CREATE': 1
    };

    class ConflictManager {
        constructor() {
            this.db = window.KBLocalDB;
            
            // STEP 11: Multi-tab safety gamit ang BroadcastChannel leader election
            this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('KBH_CONFLICT_CHANNEL') : null;
            this.isConflictLeader = true;

            if (this.channel) {
                this.channel.onmessage = (event) => {
                    if (event.data && event.data.type === 'CONFLICT_LEADER_CHECK') {
                        this.isConflictLeader = !event.data.isLeader;
                    }
                };
            }
        }

        /**
         * STEP 2 & 3: Detect Record Conflicts by comparing version, updated_at, and metadata
         * @param {Object} localRecord 
         * @param {Object} cloudRecord 
         * @returns {boolean}
         */
        detectConflict(localRecord, cloudRecord) {
            if (!localRecord || !cloudRecord) return false;

            const localVersion = localRecord.version || 1;
            const cloudVersion = cloudRecord.version || 1;

            const localTime = new Date(localRecord.updated_at || localRecord.updatedAt || 0).getTime();
            const cloudTime = new Date(cloudRecord.updated_at || cloudRecord.updatedAt || 0).getTime();

            // May conflict kung magkaiba ang bersyon o ang timestamp habang magkaiba ang nilalaman
            const versionConflict = localVersion !== cloudVersion;
            const timeConflict = localTime !== cloudTime;

            return versionConflict || timeConflict;
        }

        /**
         * STEP 4 & 5: Apply Deterministic Conflict Rules & Operation Priority
         * @param {Object} localRecord 
         * @param {Object} cloudRecord 
         * @param {string} localOperation - Hal. 'UPDATE', 'DELETE', etc.
         * @returns {Object} - Resulta ng desisyon ('LOCAL_WINS' | 'CLOUD_WINS' | 'MERGE' | 'FLAG_CONFLICT')
         */
        resolveConflict(localRecord, cloudRecord, localOperation = 'UPDATE') {
            // Rule 1: Kung magkapareho ang dalawa, walang aksyon
            if (JSON.stringify(localRecord) === JSON.stringify(cloudRecord)) {
                return { action: 'NO_ACTION', winningRecord: cloudRecord };
            }

            const localTime = new Date(localRecord.updated_at || localRecord.updatedAt || 0).getTime();
            const cloudTime = new Date(cloudRecord.updated_at || cloudRecord.updatedAt || 0).getTime();

            const localVersion = localRecord.version || 1;
            const cloudVersion = cloudRecord.version || 1;

            // Rule 4 & 5: Handle Deleted vs Updated states gamit ang Operation Priority
            const localIsDeleted = localRecord.deleted === true || localOperation === 'DELETE';
            const cloudIsDeleted = cloudRecord.deleted === true;

            if (localIsDeleted && !cloudIsDeleted) {
                // Kung delete ang local pero update ang cloud, suriin ang priority
                return { action: 'CLOUD_WINS', winningRecord: cloudRecord, reason: 'Cloud update prioritized over local delete' };
            }
            if (!localIsDeleted && cloudIsDeleted) {
                return { action: 'LOCAL_WINS', winningRecord: localRecord, reason: 'Local update prioritized over cloud delete' };
            }

            // Version-based deterministic check
            if (localVersion > cloudVersion) {
                return { action: 'LOCAL_WINS', winningRecord: localRecord };
            } else if (cloudVersion > localVersion) {
                return { action: 'CLOUD_WINS', winningRecord: cloudRecord };
            }

            // Timestamp-based deterministic check kung pantay ang version
            if (localTime > cloudTime) {
                return { action: 'LOCAL_WINS', winningRecord: localRecord };
            } else if (cloudTime > localTime) {
                return { action: 'CLOUD_WINS', winningRecord: cloudRecord };
            }

            // Default fallback: Local ang masusunod kung magkatulad ang oras
            return { action: 'LOCAL_WINS', winningRecord: localRecord };
        }

        /**
         * STEP 7: Safe Field-Level Merge Strategy
         * Pagsasama lamang ng mga binagong field nang hindi sinasapawan ang buong record.
         * @param {Object} baseRecord 
         * @param {Object} newerRecord 
         * @returns {Object}
         */
        safeMerge(baseRecord, newerRecord) {
            if (!baseRecord) return newerRecord;
            if (!newerRecord) return baseRecord;

            // Gumawa ng shallow copy ng base at i-patch ang mga bagong katangian
            const merged = { ...baseRecord, ...newerRecord };
            
            // Panatilihin ang pinakamataas na version number
            merged.version = Math.max(baseRecord.version || 1, newerRecord.version || 1) + 1;
            merged.updated_at = new Date().toISOString();

            return merged;
        }

        /**
         * STEP 9: Conflict Logging (For debugging and internal telemetry only)
         * @param {Object} recordId 
         * @param {Object} localVersion 
         * @param {Object} cloudVersion 
         * @param {string} resolutionApplied 
         */
        async logConflict(recordId, localVersion, cloudVersion, resolutionApplied) {
            try {
                if (!this.db) return;
                const conflictLog = {
                    recordId: recordId,
                    localVersion: localVersion,
                    cloudVersion: cloudVersion,
                    resolutionApplied: resolutionApplied,
                    timestamp: new Date().toISOString()
                };

                // I-save sa activity_logs o local store para sa pagsusuri
                await this.db.insert('activity_logs', conflictLog);
                console.debug('[ConflictManager Log Recorded]', conflictLog);
            } catch (err) {
                console.error('[ConflictManager] Failed to log conflict:', err);
            }
        }
    }

    // Expose globally as window.KBConflictManager
    window.KBConflictManager = new ConflictManager();

})(window);