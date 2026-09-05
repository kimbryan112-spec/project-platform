/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — STAGE 4: PRODUCTION LOGGER (Phase 2)
 * ============================================================================
 */
(function (window) {
    'use strict';

    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        SYNC: 2,
        CACHE: 3,
        WARNING: 4,
        ERROR: 5
    };

    // Baguhin sa LOG_LEVELS.WARNING o ERROR kapag nasa production para linisin ang console
    const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG; 

    class ProductionLogger {
        _log(levelName, levelValue, args) {
            if (levelValue >= CURRENT_LOG_LEVEL) {
                const timestamp = new Date().toISOString();
                const prefix = `[KBH ${levelName}] [${timestamp}]`;
                
                if (levelName === 'ERROR') {
                    console.error(prefix, ...args);
                } else if (levelName === 'WARNING') {
                    console.warn(prefix, ...args);
                } else {
                    console.log(prefix, ...args);
                }
            }
        }

        debug(...args) { this._log('DEBUG', LOG_LEVELS.DEBUG, args); }
        info(...args) { this._log('INFO', LOG_LEVELS.INFO, args); }
        sync(...args) { this._log('SYNC', LOG_LEVELS.SYNC, args); }
        cache(...args) { this._log('CACHE', LOG_LEVELS.CACHE, args); }
        warn(...args) { this._log('WARNING', LOG_LEVELS.WARNING, args); }
        error(...args) { this._log('ERROR', LOG_LEVELS.ERROR, args); }
    }

    window.KBLogger = new ProductionLogger();

})(window);