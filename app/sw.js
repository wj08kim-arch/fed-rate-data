// 오프라인에서도 마지막으로 본 화면이 열리도록: 같은 주소의 파일은 먼저 인터넷에서 받고, 실패하면 저장본을 쓴다.
const CACHE = "fed-rate-v11";
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

// 휴대폰 푸시 알림 (fed_model/push_send.py 가 보낸다)
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "연준 금리 전망", {
    body: d.body || "", icon: "icons/192.png", badge: "icons/192.png", tag: d.tag, data: { url: d.url || "./" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
