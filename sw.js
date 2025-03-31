self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("static").then((cache) => {
      return cache.addAll([
        "/",
        "index.html",
        "script.js",
        "style.css",
        "icons/links.png",
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  if (url.protocol === "chrome-extension:") {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((response) => {
      return (
        response ||
        fetch(e.request).then((response) => {
          if (
            response &&
            response.status === 200 &&
            url.protocol !== "chrome-extension:"
          ) {
            caches.open("dynamic").then((cache) => {
              cache.put(e.request, response.clone());
            });
          }
          return response;
        })
      );
    })
  );
});
