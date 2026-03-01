// ==UserScript==
// @name         Cookie Utilities
// @namespace    http://yournamespace/
// @version      1.0
// @description  Cookie management utilities — read, write, delete, compare, and export cookies on any page
// @author       You
// @match        *://*/*
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function buildUrl(domain, path) {
        const protocol = window.location.protocol;

        if (domain.startsWith('.')) {
            domain = domain.substring(1);
        }

        return `${protocol}//${domain}${path}`;
    }

    function deleteAll(cookieList) {
        cookieList.forEach(curr => {
            deleteCookie(curr.name);
        });
    }

    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    }

    function setCookie(name, value, days, path, domain, secure, httpOnly) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }

        let cookieString = name + "=" + encodeURIComponent(value || "") + expires + "; path=" + (path || "/");

        if (domain) {
            cookieString += "; domain=" + domain;
        }

        if (secure) {
            cookieString += "; secure";
        }

        if (httpOnly) {
            cookieString += "; HttpOnly"; // Note: This flag cannot be set from JavaScript in most browsers.
        }

        document.cookie = cookieString;
    }

    function Filter() {
        var filter = {};

        this.setUrl = function(url) {
            filter.url = url;
        };

        this.setDomain = function(domain) {
            filter.domain = domain;
        };

        this.setName = function(name) {
            filter.name = name;
        };

        this.setSecure = function(secure) {
            filter.secure = secure;
        };

        this.setSession = function(session) {
            filter.session = session;
        };

        this.getFilter = function() {
            return filter;
        };
    }

    function cookieForCreationFromFullCookie(fullCookie) {
        var newCookie = {};
        newCookie.url = `${fullCookie.secure ? 'https' : 'http'}://${fullCookie.domain}${fullCookie.path}`;
        newCookie.name = fullCookie.name;
        newCookie.value = fullCookie.value;

        if (!fullCookie.hostOnly) {
            newCookie.domain = fullCookie.domain;
        }

        newCookie.path = fullCookie.path;
        newCookie.secure = fullCookie.secure;
        newCookie.httpOnly = fullCookie.httpOnly;

        if (!fullCookie.session) {
            newCookie.expirationDate = fullCookie.expirationDate;
        }

        newCookie.storeId = fullCookie.storeId;
        return newCookie;
    }

    function compareCookies(b, a) {
        try {
            return (
                b.name === a.name &&
                b.value === a.value &&
                b.path === a.path &&
                b.secure === a.secure &&
                b.httpOnly === a.httpOnly &&
                !!(a.hostOnly || a.domain === undefined) === !!(b.hostOnly || b.domain === undefined) &&
                (a.hostOnly || b.domain === a.domain) &&
                !!(a.session || a.expirationDate === undefined) === !!(b.session || b.expirationDate === undefined) &&
                (a.session || b.expirationDate === a.expirationDate)
            );
        } catch (e) {
            console.error(e.message);
            return false;
        }
    }

    var cookiesToString = {
        get: function(cookies) {
            // Implement your specific logic for converting cookies to different formats
        },

        netscape: function(cookies) {
            // Implement logic to convert cookies to Netscape format
        },

        json: function(cookies) {
            return JSON.stringify(cookies.map((cookie, i) => ({ ...cookie, id: i + 1 })), null, 4);
        },

        semicolonPairs: function(cookies) {
            // Implement logic for semicolon-paired string.
        },

        lpw: function(cookies) {
            // Implement logic for lpw format.
        }
    };

    // Expose utilities to the page context so they are accessible from the
    // browser console and other scripts running on the page.
    unsafeWindow.CookieUtils = {
        buildUrl,
        deleteAll,
        deleteCookie,
        setCookie,
        Filter,
        cookieForCreationFromFullCookie,
        compareCookies,
        cookiesToString
    };

    console.log('%c[Cookie Utilities] loaded — access via window.CookieUtils', 'color: cyan; font-weight: bold;');

})();
