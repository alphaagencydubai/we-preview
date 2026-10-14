/* WE — offline shell */
var C='we-v1';
var FILES=["./", "index.html", "app.css", "fonts.css", "app.js", "data.js", "manifest.webmanifest", "assets/alpha-black.png", "assets/alpha-white.png", "assets/ed-wide.webp", "assets/hero-9x16.webp", "assets/icon-192.png", "assets/icon-512.png", "assets/logo-white.png", "assets/logo.png", "assets/p-butterfly-tee.webp", "assets/p-butterfly-worn.webp", "assets/p-cargo-shorts.webp", "assets/p-dark-tee.webp", "assets/p-dark-worn.webp", "assets/p-grid-tee.webp", "assets/p-grid-worn.webp", "assets/p-wide-pants.webp", "fonts/40fe3cf772.woff2", "fonts/a6f395c163.woff2", "fonts/cfa139c266.woff2", "fonts/e5bab11d09.woff2"];
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(function(c){return c.addAll(FILES).catch(function(){});}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.filter(function(n){return n!==C;}).map(function(n){return caches.delete(n);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  var u=new URL(e.request.url);
  if(u.origin!==location.origin) return;
  e.respondWith(caches.match(e.request).then(function(r){
    return r || fetch(e.request).then(function(res){
      var copy=res.clone();
      caches.open(C).then(function(c){c.put(e.request,copy);});
      return res;
    }).catch(function(){ return caches.match('index.html'); });
  }));
});
