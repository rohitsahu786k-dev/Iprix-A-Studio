/* Lisstify shared logger.
 *
 * Usage:
 *   const log = LisstifyLog.create('FK-PRICE', '#10b981');
 *   log.info('switching tabs', { tab });
 *   log.warn('field missing', id);
 *   log.error('fill failed', err);
 *   log.debug('value set', val);   // gated by LisstifyLog.enabled
 *
 * Toggle verbose `debug` output from a devtools console:
 *   LisstifyLog.setEnabled(true)      // persists in localStorage if available
 *   LisstifyLog.setLevel('warn')      // 'debug' | 'info' | 'warn' | 'error' | 'silent'
 */
(function (scope) {
    if (scope.LisstifyLog) return;

    const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };
    const DEFAULT_LEVEL = 'info';

    let currentLevel = DEFAULT_LEVEL;
    let debugEnabled = false;

    try {
        const stored = (scope.localStorage && scope.localStorage.getItem('lisstify_log_level')) || null;
        if (stored && LEVELS[stored] != null) currentLevel = stored;
        const dbg = scope.localStorage && scope.localStorage.getItem('lisstify_debug');
        if (dbg === '1' || dbg === 'true') debugEnabled = true;
    } catch (_) { /* SW or sandboxed context — no localStorage */ }

    function shouldLog(level) {
        if (level === 'debug' && !debugEnabled) return false;
        return LEVELS[level] >= LEVELS[currentLevel];
    }

    function create(tag, color) {
        const badge = `%c[${tag}]`;
        const css = `background:${color || '#6366f1'};color:#fff;padding:1px 6px;border-radius:3px;font-weight:600`;
        const emit = (method, level, args) => {
            if (!shouldLog(level)) return;
            // eslint-disable-next-line no-console
            console[method](badge, css, ...args);
        };
        return {
            debug: (...a) => emit('log',   'debug', a),
            info:  (...a) => emit('log',   'info',  a),
            log:   (...a) => emit('log',   'info',  a),
            warn:  (...a) => emit('warn',  'warn',  a),
            error: (...a) => emit('error', 'error', a),
        };
    }

    scope.LisstifyLog = {
        create,
        setLevel(level) {
            if (LEVELS[level] == null) return;
            currentLevel = level;
            try { scope.localStorage && scope.localStorage.setItem('lisstify_log_level', level); } catch (_) {}
        },
        getLevel: () => currentLevel,
        setEnabled(on) {
            debugEnabled = !!on;
            try { scope.localStorage && scope.localStorage.setItem('lisstify_debug', on ? '1' : '0'); } catch (_) {}
        },
        isEnabled: () => debugEnabled,
    };
})(typeof self !== 'undefined' ? self : globalThis);

/* ── A+ Studio crash reporter ──
 * Captures uncaught errors thrown by OUR extension scripts only (filtered by
 * chrome-extension:// source) and keeps the last 50 in chrome.storage.local
 * under `aplus_error_log`, so marketplace fill bugs reported by sellers can be
 * diagnosed from real data instead of guesses. No network calls.
 */
(function (scope) {
    if (scope.__aplusCrashReporter) return;
    scope.__aplusCrashReporter = true;

    var hasStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    if (!hasStorage) return;

    function record(entry) {
        try {
            chrome.storage.local.get(['aplus_error_log'], function (res) {
                try {
                    var log = Array.isArray(res.aplus_error_log) ? res.aplus_error_log : [];
                    log.push(entry);
                    if (log.length > 50) log = log.slice(log.length - 50);
                    chrome.storage.local.set({ aplus_error_log: log });
                } catch (_) { /* storage gone (extension reloaded) */ }
            });
        } catch (_) { /* extension context invalidated */ }
    }

    function fromOurScripts(source) {
        return typeof source === 'string' && source.indexOf('chrome-extension://') === 0;
    }

    if (typeof scope.addEventListener === 'function') {
        scope.addEventListener('error', function (event) {
            if (!event || !fromOurScripts(event.filename || '')) return;
            record({
                t: Date.now(),
                url: (scope.location && scope.location.href || '').slice(0, 200),
                msg: String(event.message || '').slice(0, 300),
                src: String(event.filename || '').split('/').pop(),
                line: event.lineno || 0,
            });
        });
        scope.addEventListener('unhandledrejection', function (event) {
            var reason = event && event.reason;
            var stack = reason && reason.stack ? String(reason.stack) : '';
            if (stack.indexOf('chrome-extension://') === -1) return;
            record({
                t: Date.now(),
                url: (scope.location && scope.location.href || '').slice(0, 200),
                msg: String((reason && reason.message) || reason || '').slice(0, 300),
                src: 'promise',
                line: 0,
            });
        });
    }
})(typeof self !== 'undefined' ? self : globalThis);
