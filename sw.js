const V='artemis-v47-lock';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>fetch(new Request(u,{cache:'reload'})).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const isPage=r=>r.mode==='navigate'||/\/(index\.html)?$/.test(new URL(r.url).pathname);
const wait=ms=>new Promise(x=>setTimeout(()=>x(null),ms));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  const same=u.origin===location.origin;
  const ok=same||u.host==='fonts.googleapis.com'||u.host==='fonts.gstatic.com';
  if(!ok)return;
  e.respondWith((async()=>{
    const c=await caches.open(V);
    if(same&&isPage(r)){
      const old=await c.match('index.html');
      if(old&&self.navigator&&self.navigator.onLine===false)return old;
      const net=fetch(new Request(r.url,{cache:'reload'})).then(res=>{if(res&&res.ok)c.put('index.html',res.clone());return res}).catch(()=>null);
      e.waitUntil(net);
      const res=await Promise.race([net,wait(2500)]);
      if(res)return res;
      return old||(await net)||new Response('',{status:504});
    }
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const res=await (same?net:Promise.race([net,wait(2500)]));
    return res||new Response('',{status:504});
  })());
});
