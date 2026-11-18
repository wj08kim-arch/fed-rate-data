// 오프라인에서도 마지막으로 본 화면이 열리도록: 같은 주소의 파일은 먼저 인터넷에서 받고, 실패하면 저장본을 쓴다.
const CACHE = "fed-rate-v2";
const SHELL = ["./", "index.html", "style.css", "i18n.js", "dashboard.js", "config.js", "vendor/html2canvas.min.js", "icons/192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;  // PRO 서버(Supabase) 등 다른 주소는 건드리지 않는다
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
