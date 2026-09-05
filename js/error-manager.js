/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 4: CENTRAL ERROR MANAGER (Phase 1 Optimized)
 * ============================================================================
 */
(function (window) {
    'use strict';

    class CentralErrorManager {
        constructor() {
            this.logger = window.KBLogger || console;
            this._initGlobalListeners();
        }

        _initGlobalListeners() {
            // Mahuli ang mga unhandled JS runtime errors
            window.addEventListener('error', (event) => {
                this.handleError('RUNTIME_ERROR', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error ? event.error.stack : null
                });
            });

            // Mahuli ang mga unhandled promise rejections (async/fetch/indexeddb failures)
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError('PROMISE_REJECTION', {
                    reason: event.reason ? (event.reason.stack || event.reason.message || event.reason) : 'Unknown rejection'
                });
            });
        }

        handleError(category, errorDetails) {
            const errorPayload = {
                category: category,
                details: errorDetails,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            // Suriin kung ito ay patungkol sa Quota o Rate Limit (Status 429 o limit exceeded)
            const detailsStr = JSON.stringify(errorDetails).toLowerCase();
            if (
                detailsStr.includes('quota') || 
                detailsStr.includes('limit') || 
                detailsStr.includes('exceeded') || 
                detailsStr.includes('429') ||
                errorDetails.status === 429
            ) {
                window.isQuotaExceeded = true;
                // I-trigger ang event para mag-update ang status indicator sa UI
                window.dispatchEvent(new Event('offline')); // o custom status check event
            }

            // I-log gamit ang ating Production Logger
            if (this.logger && typeof this.logger.error === 'function') {
                this.logger.error(`[ErrorManager] Captured ${category}:`, errorPayload);
            } else {
                console.error('[ErrorManager Fallback]', errorPayload);
            }

            // Ligtas na ibinabalik nang hindi hinahayaang mag-crash ang app (Graceful degradation)
            return errorPayload;
        }

        captureApiError(endpoint, status, error) {
            if (status === 429) {
                window.isQuotaExceeded = true;
            }
            return this.handleError('API_FAILURE', { endpoint, status, error });
        }

        captureSyncError(operationId, error) {
            return this.handleError('SYNC_FAILURE', { operationId, error });
        }

        captureDbError(storeName, error) {
            return this.handleError('INDEXED_DB_FAILURE', { storeName, error });
        }
    }

    window.KBErrorManager = new CentralErrorManager();

})(window);