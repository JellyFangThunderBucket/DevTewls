// ==UserScript==
// @name         Eruda Enhanced Data Collector - iPhone
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Feeds rich iPhone sensor and environment data into Eruda console
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Poll until Eruda is available (injected by the companion loader script)
    function waitForEruda(cb) {
        if (window.eruda) return cb();
        setTimeout(() => waitForEruda(cb), 500);
    }

    waitForEruda(() => {

        // ── DEVICE INFO ──────────────────────────────────────
        console.log('[Device Info]', {
            userAgent:           navigator.userAgent,
            platform:            navigator.platform,
            vendor:              navigator.vendor,
            language:            navigator.language,
            languages:           Array.from(navigator.languages || []),
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory:        navigator.deviceMemory ?? 'N/A',
            cookieEnabled:       navigator.cookieEnabled,
            onLine:              navigator.onLine,
            maxTouchPoints:      navigator.maxTouchPoints,
            screenWidth:         screen.width,
            screenHeight:        screen.height,
            colorDepth:          screen.colorDepth,
            pixelDepth:          screen.pixelDepth,
            devicePixelRatio:    window.devicePixelRatio,
            viewportWidth:       window.innerWidth,
            viewportHeight:      window.innerHeight,
        });

        // ── BATTERY ──────────────────────────────────────────
        if (navigator.getBattery) {
            navigator.getBattery().then(b => {
                const report = () => ({
                    level:           (b.level * 100).toFixed(1) + '%',
                    charging:        b.charging,
                    chargingTime:    b.chargingTime === Infinity ? '∞' : b.chargingTime + ' s',
                    dischargingTime: b.dischargingTime === Infinity ? '∞' : b.dischargingTime + ' s',
                });
                console.log('[Battery]', report());
                b.addEventListener('levelchange',   () => console.log('[Battery] Level changed:',    (b.level * 100).toFixed(1) + '%'));
                b.addEventListener('chargingchange', () => console.log('[Battery] Charging changed:', b.charging));
            }).catch(e => console.warn('[Battery] Error:', e.message));
        }

        // ── NETWORK ──────────────────────────────────────────
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            const logNetwork = () => console.log('[Network]', {
                type:         conn.type         ?? 'N/A',
                effectiveType: conn.effectiveType ?? 'N/A',
                downlink:     conn.downlink      != null ? conn.downlink + ' Mbps' : 'N/A',
                downlinkMax:  conn.downlinkMax   != null ? conn.downlinkMax + ' Mbps' : 'N/A',
                rtt:          conn.rtt           != null ? conn.rtt + ' ms' : 'N/A',
                saveData:     conn.saveData,
            });
            logNetwork();
            conn.addEventListener('change', () => { console.log('[Network] Connection changed'); logNetwork(); });
        } else {
            console.log('[Network] Connection API not available');
        }
        window.addEventListener('online',  () => console.log('[Network] Status: online'));
        window.addEventListener('offline', () => console.log('[Network] Status: offline'));

        // ── GEOLOCATION ──────────────────────────────────────
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => console.log('[Geolocation]', {
                    latitude:         pos.coords.latitude,
                    longitude:        pos.coords.longitude,
                    accuracy:         pos.coords.accuracy + ' m',
                    altitude:         pos.coords.altitude         != null ? pos.coords.altitude + ' m'         : 'N/A',
                    altitudeAccuracy: pos.coords.altitudeAccuracy != null ? pos.coords.altitudeAccuracy + ' m' : 'N/A',
                    heading:          pos.coords.heading          != null ? pos.coords.heading + '°'           : 'N/A',
                    speed:            pos.coords.speed            != null ? pos.coords.speed + ' m/s'          : 'N/A',
                    timestamp:        new Date(pos.timestamp).toISOString(),
                }),
                err => console.warn('[Geolocation] Error:', err.message),
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
        }

        // ── SCREEN ORIENTATION ────────────────────────────────
        const orient = screen.orientation;
        if (orient) {
            console.log('[Screen Orientation]', { type: orient.type, angle: orient.angle + '°' });
            orient.addEventListener('change', () =>
                console.log('[Screen Orientation] Changed:', orient.type, orient.angle + '°'));
        }

        // ── DEVICE MOTION (Accelerometer + Gyroscope) ─────────
        let motionLogged = false;
        window.addEventListener('devicemotion', e => {
            if (motionLogged) return;
            motionLogged = true;
            const acc  = e.acceleration;
            const accG = e.accelerationIncludingGravity;
            const rot  = e.rotationRate;
            console.log('[Device Motion]', {
                acceleration:                 acc  ? { x: acc.x,  y: acc.y,  z: acc.z  } : 'N/A',
                accelerationIncludingGravity: accG ? { x: accG.x, y: accG.y, z: accG.z } : 'N/A',
                rotationRate:                 rot  ? { alpha: rot.alpha, beta: rot.beta, gamma: rot.gamma } : 'N/A',
                interval:                     e.interval + ' ms',
            });
        });

        // ── DEVICE ORIENTATION (Compass / Tilt) ───────────────
        let deviceOrientLogged = false;
        window.addEventListener('deviceorientation', e => {
            if (deviceOrientLogged) return;
            deviceOrientLogged = true;
            console.log('[Device Orientation]', {
                alpha:    e.alpha != null ? e.alpha.toFixed(2) + '°' : 'N/A',
                beta:     e.beta  != null ? e.beta.toFixed(2)  + '°' : 'N/A',
                gamma:    e.gamma != null ? e.gamma.toFixed(2) + '°' : 'N/A',
                absolute: e.absolute,
            });
        });

        // ── AMBIENT LIGHT SENSOR ──────────────────────────────
        if ('AmbientLightSensor' in window) {
            try {
                const light = new AmbientLightSensor();
                let lightLogged = false;
                light.addEventListener('reading', () => {
                    if (!lightLogged) { lightLogged = true; console.log('[Ambient Light]', light.illuminance + ' lux'); }
                });
                light.addEventListener('error', e => console.warn('[Ambient Light] Error:', e.error.message));
                light.start();
            } catch (e) {
                console.warn('[Ambient Light] Could not start:', e.message);
            }
        }

        // ── TOUCH CAPABILITY ─────────────────────────────────
        console.log('[Touch]', {
            maxTouchPoints: navigator.maxTouchPoints,
            touchEvent:     'ontouchstart' in window,
            pointerEvent:   'onpointerdown' in window,
        });

        // ── GPU / WEBGL ───────────────────────────────────────
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const dbg = gl.getExtension('WEBGL_debug_renderer_info');
                console.log('[GPU / WebGL]', {
                    vendor:                  dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)   : gl.getParameter(gl.VENDOR),
                    renderer:                dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
                    version:                 gl.getParameter(gl.VERSION),
                    shadingLanguageVersion:  gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                    maxTextureSize:          gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    maxViewportDims:         Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
                });
            }
        } catch (e) {
            console.warn('[GPU / WebGL] Error:', e.message);
        }

        // ── PERMISSIONS ───────────────────────────────────────
        if (navigator.permissions) {
            const permNames = [
                'camera', 'microphone', 'geolocation',
                'notifications', 'persistent-storage', 'clipboard-read',
                'accelerometer', 'gyroscope', 'magnetometer',
            ];
            const perms = {};
            Promise.allSettled(
                permNames.map(name =>
                    navigator.permissions.query({ name }).then(r => { perms[name] = r.state; })
                )
            ).then(() => console.log('[Permissions]', perms));
        }

        // ── STORAGE ESTIMATES ────────────────────────────────
        if (navigator.storage?.estimate) {
            navigator.storage.estimate().then(est => {
                console.log('[Storage Quota]', {
                    quota:       (est.quota / 1e9).toFixed(2) + ' GB',
                    used:        (est.usage / 1e6).toFixed(2) + ' MB',
                    percentUsed: ((est.usage / est.quota) * 100).toFixed(2) + '%',
                });
            });
        }

        try {
            const lsKeys = Object.keys(localStorage);
            console.log('[LocalStorage]', {
                count:          lsKeys.length,
                estimatedBytes: lsKeys.reduce((n, k) => n + k.length + (localStorage[k]?.length ?? 0), 0),
                keys:           lsKeys.slice(0, 20),
            });
        } catch (e) { console.warn('[LocalStorage] Error:', e.message); }

        try {
            const ssKeys = Object.keys(sessionStorage);
            console.log('[SessionStorage]', {
                count:          ssKeys.length,
                estimatedBytes: ssKeys.reduce((n, k) => n + k.length + (sessionStorage[k]?.length ?? 0), 0),
                keys:           ssKeys.slice(0, 20),
            });
        } catch (e) { console.warn('[SessionStorage] Error:', e.message); }

        console.log('[Cookies]', { count: document.cookie ? document.cookie.split(';').length : 0 });

        if (indexedDB?.databases) {
            indexedDB.databases()
                .then(dbs => console.log('[IndexedDB]', { databases: dbs.map(d => d.name + ' v' + d.version) }))
                .catch(() => {});
        }

        // ── MEDIA DEVICES ────────────────────────────────────
        if (navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                console.log('[Media Devices]', devices.map(d => ({
                    kind:     d.kind,
                    label:    d.label || '(permission needed)',
                    deviceId: d.deviceId ? d.deviceId.slice(0, 8) + '…' : 'N/A',
                })));
            }).catch(e => console.warn('[Media Devices] Error:', e.message));
        }

        // ── PERFORMANCE ──────────────────────────────────────
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
            console.log('[Performance Timing]', {
                dnsLookup:        (navEntry.domainLookupEnd  - navEntry.domainLookupStart).toFixed(2) + ' ms',
                tcpConnect:       (navEntry.connectEnd       - navEntry.connectStart).toFixed(2) + ' ms',
                ttfb:             (navEntry.responseStart    - navEntry.requestStart).toFixed(2) + ' ms',
                domInteractive:   navEntry.domInteractive.toFixed(2) + ' ms',
                domContentLoaded: navEntry.domContentLoadedEventEnd.toFixed(2) + ' ms',
                loadComplete:     navEntry.loadEventEnd.toFixed(2) + ' ms',
                transferSize:     navEntry.transferSize ? (navEntry.transferSize / 1024).toFixed(1) + ' KB' : 'N/A',
                redirectCount:    navEntry.redirectCount,
                navigationType:   navEntry.type,
            });
        }

        if (performance.memory) {
            console.log('[JS Memory]', {
                used:      (performance.memory.usedJSHeapSize  / 1e6).toFixed(2) + ' MB',
                total:     (performance.memory.totalJSHeapSize / 1e6).toFixed(2) + ' MB',
                limit:     (performance.memory.jsHeapSizeLimit / 1e6).toFixed(2) + ' MB',
            });
        }

        // ── PAGE VISIBILITY ───────────────────────────────────
        document.addEventListener('visibilitychange', () =>
            console.log('[Visibility] Changed:', document.visibilityState));

        // ── VIEWPORT RESIZE ───────────────────────────────────
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() =>
                console.log('[Resize]', { width: window.innerWidth, height: window.innerHeight }), 300);
        });

        console.log('%c[Eruda Data Collector] All sensors initialized', 'color:lime;font-weight:bold;');
    });

})();
