const CACHE_NAME = "mdp-warszowice-v2";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([
    "./", "./index.html", "./styles.css", "./app.js", "./config.js", "./manifest.webmanifest", "./icon.svg"
  ])).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});


// Planned notifications use the ordinary system notification sound. Only urgent alerts carry the urgent flag.
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const urgent = data.type === "urgent";
  const title = data.title || (urgent ? "🚨 NAGŁE WEZWANIE MDP" : "Zbiórka MDP");
  const options = {
    body: data.body || (urgent ? "Pilne wezwanie. Otwórz powiadomienie, aby zobaczyć szczegóły." : "Masz informację o planowanej zbiórce."),
    icon: "./icon.png",
    badge: "./icon.svg",
    tag: data.tag || (urgent ? "mdp-urgent-call" : "mdp-planned-meeting"),
    renotify: true,
    data: { url: data.url || "./", type: urgent ? "urgent" : "planned" },
    vibrate: urgent ? [500, 150, 500, 150, 900] : [150]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener("notificationclick", event => {
  const urgent = event.notification.data?.type === "urgent";
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async clients => {
    let clientToFocus = clients.find(client => client.url.startsWith(self.location.origin));
    if (clientToFocus) {
      await clientToFocus.focus();
      if (urgent) clientToFocus.postMessage({ type: "MDP_PLAY_URGENT_SIREN" });
      return;
    }
    const opened = await self.clients.openWindow(target);
    // On some browsers the new page may not be ready to receive this message; system notification still opens.
    if (urgent && opened) opened.postMessage({ type: "MDP_PLAY_URGENT_SIREN" });
  }));
});
