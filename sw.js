/* Offline support for the installed app. Always tries the network first, so the newest version wins;
   falls back to the last saved copy when there is no connection. */
const V = "ja-v1";
const CORE = ["./", "./index.html", "./css/style.css", "./js/site.js", "./js/demos.js", "./js/order.js", "./projects.js",
	"./ikonplan.html", "./aform.html", "./thepanel.html", "./showroom.html", "./bankcal.html", "./scoreboard.html", "./passgen.html", "./counter.html", "./hometown.html"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
	const r = e.request;
	if (r.method !== "GET" || r.headers.has("range") || new URL(r.url).origin !== location.origin) return;
	e.respondWith(fetch(r).then((res) => {
		if (res.ok && res.status === 200) { const c = res.clone(); caches.open(V).then((x) => x.put(r, c)); }
		return res;
	}).catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
});
