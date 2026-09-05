/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 3G: HYBRID AUTH & SESSION MANAGER
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SESSION_STORE = 'sessions';
    const SESSION_KEY = 'current_user_session';
    const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours Expiration (STEP 7)

    class HybridAuthManager {
        constructor() {
            this.db = window.KBLocalDB;
        }

        /**
         * STEP 1 & 11: I-save ang validated session pagkatapos ng matagumpay na Online Login
         * (Walang passwords o secrets na iniimbak)
         */
        async cacheOnlineSession(userData) {
            try {
                if (!this.db) return false;

                const sessionPayload = {
                    key: SESSION_KEY,
                    userId: userData.id || userData.userId,
                    username: userData.username || userData.email,
                    displayName: userData.fullname || userData.displayName,
                    role: userData.role,
                    permissions: userData.permissions || [],
                    expiresAt: Date.now() + SESSION_TTL_MS,
                    refreshedAt: Date.now()
                };

                await this.db.insert(SESSION_STORE, sessionPayload);
                console.debug('[HybridAuth] Online session safely cached for offline fallback.');
                return true;
            } catch (err) {
                console.error('[HybridAuth] Failed to cache session:', err);
                return false;
            }
        }

        /**
         * STEP 2: Suriin kung may valid cached session para sa Offline Login
         */
        async getValidCachedSession() {
            try {
                if (!this.db) return null;

                const session = await this.db.get(SESSION_STORE, SESSION_KEY);
                if (!session) return null;

                // Suriin kung nag-expire na (24 hours)
                if (Date.now() > session.expiresAt) {
                    console.warn('[HybridAuth] Cached session has expired. Online login required.');
                    await this.db.delete(SESSION_STORE, SESSION_KEY);
                    return null;
                }

                return session;
            } catch (err) {
                console.error('[HybridAuth] Error validating cached session:', err);
                return null;
            }
        }

        /**
         * STEP 8: Queue Protection bago mag-logout
         */
        async canSafelyLogout() {
            if (window.KBSyncQueue) {
                const count = await window.KBSyncQueue.getQueueCount();
                return count === 0;
            }
            return true;
        }

        async clearSession() {
            try {
                if (this.db) {
                    await this.db.delete(SESSION_STORE, SESSION_KEY);
                }
            } catch (err) {
                console.error('[HybridAuth] Error clearing session:', err);
            }
        }
    }

    window.KBHybridAuth = new HybridAuthManager();

})(window);