const CACHE_NAME = "mdp-warszowice-v10";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([
    "./", "./index.html", "./styles.css", "./app.js", "./config.js", "./manifest.webmanifest", "./icon.svg"
  ])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}

  const type = data.type || "planned";
  const urgent = type === "urgent";
  const title = data.title || (urgent ? "🚨 NAGŁE WEZWANIE MDP" : "MDP Warszowice");
  const options = {
    body: data.body || (urgent ? "Pilne wezwanie. Otwórz powiadomienie, aby zobaczyć szczegóły." : "Masz nową informację w aplikacji MDP Warszowice."),
    icon: "./icon.png",
    badge: "./icon.svg",
    tag: data.tag || `mdp-${type}-${Date.now()}`,
    renotify: true,
    data: { url: data.url || "./", type },
    vibrate: urgent ? [500, 150, 500, 150, 900] : [150, 80, 150]
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    if (urgent) {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if (client.visibilityState === "visible") client.postMessage({ type: "MDP_URGENT_PUSH_RECEIVED" });
      }
    }
  })());
});

self.addEventListener("notificationclick", event => {
  const notificationType = event.notification.data?.type || "planned";
  const urgent = notificationType === "urgent";
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.location.origin).href;

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async clients => {
    const clientToFocus = clients.find(client => client.url.startsWith(self.location.origin));
    if (clientToFocus) {
      await clientToFocus.focus();
      if (urgent) clientToFocus.postMessage({ type: "MDP_PLAY_URGENT_SIREN" });
      return;
    }
    const opened = await self.clients.openWindow(target);
    if (urgent && opened) opened.postMessage({ type: "MDP_PLAY_URGENT_SIREN" });
  }));
});
