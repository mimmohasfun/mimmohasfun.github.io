/* coi-serviceworker v0.1.7 - https://github.com/gzuidhof/coi-serviceworker - License: MIT */
/* Adds Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers via a
   service worker, enabling SharedArrayBuffer on hosts that don't support custom headers
   (e.g. GitHub Pages). This file doubles as both the service worker and the registration
   snippet: include it as a normal <script> tag in your page. */

if (typeof window === "undefined") {
    // Running as a service worker — intercept fetches and add COOP/COEP headers.
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        const request = event.request;
        if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

        event.respondWith(
            fetch(request).then((response) => {
                if (response.status === 0) return response;
                const headers = new Headers(response.headers);
                headers.set("Cross-Origin-Opener-Policy", "same-origin");
                headers.set("Cross-Origin-Embedder-Policy", "require-corp");
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers,
                });
            })
        );
    });
} else {
    // Running as a page script — register this file as a service worker.
    if (window.crossOriginIsolated !== false) {
        // Already cross-origin isolated, no action needed.
        return;
    }
    navigator.serviceWorker
        .register(document.currentScript.src)
        .then((reg) => {
            reg.addEventListener("updatefound", () => {
                const sw = reg.installing;
                if (sw) {
                    sw.addEventListener("statechange", (e) => {
                        if (e.target.state === "activated") window.location.reload();
                    });
                }
            });
            if (reg.active && !navigator.serviceWorker.controller) {
                window.location.reload();
            }
        })
        .catch(console.error);
}
