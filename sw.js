const V='artemis-v27-lock';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>fetch(new Request(u,{cache:'reload'})).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const isPage=r=>r.mode==='navigate'||/\/(index\.html)?$/.test(new URL(r.url).pathname);
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  const ok=u.origin===location.origin||u.host==='fonts.googleapis.com'||u.host==='fonts.gstatic.com';
  if(!ok)return;
  e.respondWith((async()=>{
    const c=await caches.open(V);
    if(u.origin===location.origin&&isPage(r)){
      const net=fetch(new Request(r.url,{cache:'reload'})).then(res=>{if(res&&res.ok)c.put('index.html',res.clone());return res}).catch(()=>null);
      const res=await Promise.race([net,new Promise(x=>setTimeout(()=>x(null),3000))]);
      if(res)return res;
      const hit=await c.match('index.html');
      return hit||(await net)||new Response('',{status:504});
    }
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||new Response('',{status:504});
  })());
});
