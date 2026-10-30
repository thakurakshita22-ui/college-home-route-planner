(() => {
  const $ = (id) => document.getElementById(id);
  const college = {name: "Chandigarh University, Gharuan", lat: 30.770523, lon: 76.570239};
  const map = L.map("map", {zoomControl:true}).setView([college.lat, college.lon], 11);
  const darkTiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO', maxZoom: 19
  }).addTo(map);
  const standardTiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
  });
  L.control.layers({"Dark map":darkTiles,"Standard map":standardTiles}, {}, {position:"topright"}).addTo(map);
  const overlays = L.layerGroup().addTo(map);
  let current = null, latestData = null, selectedRoute = 0;
  const originMarker = L.circleMarker([college.lat,college.lon],{radius:7,color:"#b6a9ff",fillColor:"#9b8cff",fillOpacity:1,weight:2}).addTo(overlays).bindTooltip("Chandigarh University");
  let destMarker = null;
  const storage = {
    get(k){try{return JSON.parse(localStorage.getItem("rp_"+k)||"[]")}catch(e){return []}},
    set(k,v){localStorage.setItem("rp_"+k,JSON.stringify(v))}
  };
  const fmtDistance = km => $("units")?.value === "mi" ? (km*0.621371).toFixed(1)+" mi" : Number(km).toFixed(1)+" km";
  function note(message, type="") { $("notice").textContent=message; $("notice").className="notice "+type; }
  function showEmpty(text) { $("results").innerHTML=`<div class="empty-state"><span class="empty-icon">⌁</span><strong>${text}</strong><p>Search a destination to see route details.</p></div>`; }
  function drawRoutes(data) {
    overlays.clearLayers();
    L.circleMarker([data.origin.lat,data.origin.lon],{radius:7,color:"#c4baff",fillColor:"#9b8cff",fillOpacity:1,weight:2}).addTo(overlays).bindTooltip("Start · "+data.origin.name);
    destMarker=L.circleMarker([data.destination.lat,data.destination.lon],{radius:7,color:"#9ed0ff",fillColor:"#62a9ff",fillOpacity:1,weight:2}).addTo(overlays).bindTooltip("Destination · "+data.destination.name);
    const colors=["#9b8cff","#62a9ff","#f0b56b"];
    data.routes.forEach((r,i)=>{
      const line=L.geoJSON(r.geometry,{style:{color:colors[i%colors.length],weight:i===0?6:4,opacity:i===0?0.95:0.72,dashArray:i===0?null:"7 7"}}).addTo(overlays);
      line.bindTooltip((i===0?"Recommended":"Alternative "+(i+1))+" · "+fmtDistance(r.distance_km));
      r._bounds=line.getBounds();
    });
    const all=L.featureGroup(overlays.getLayers().filter(l=>l.getBounds || l.getLatLng));
    if(data.routes[0] && data.routes[0]._bounds) map.fitBounds(data.routes[0]._bounds.pad(0.15),{maxZoom:14});
    $("map-caption").textContent=data.origin.name.split(",")[0]+" → "+data.destination.name.split(",")[0];
  }
  function renderCards(data) {
    $("results").innerHTML="";
    data.routes.forEach((r,i)=>{
      const card=document.createElement("article");
      card.className="route-card "+(i===0?"recommended":"")+(i===selectedRoute?" selected":"");
      const cost = r.cost_inr===null ? "—" : "₹"+Math.round(r.cost_inr);
      card.innerHTML=`<div class="route-top"><span class="route-name">${i===0?"Recommended route":"Alternative "+i}</span>${i===0?'<span class="tag">BEST MATCH</span>':""}</div>
      <div class="route-metrics"><div class="metric"><small>DISTANCE</small><strong>${fmtDistance(r.distance_km)}</strong></div><div class="metric"><small>EST. TIME</small><strong>${r.duration_min}<span> min</span></strong></div><div class="metric"><small>EST. COST</small><strong>${cost}</strong></div></div>
      <div class="route-reason">${r.reason}</div>`;
      card.addEventListener("click",()=>{selectedRoute=i;document.querySelectorAll(".route-card").forEach(x=>x.classList.remove("selected"));card.classList.add("selected");const line=overlays.getLayers()[2+i];if(line&&line.getBounds)map.fitBounds(line.getBounds().pad(.15));});
      $("results").appendChild(card);
    });
    $("results-subtitle").textContent=`${data.routes.length} route option${data.routes.length===1?"":"s"} · ${data.traffic}`;
    ["save-btn","export-btn","share-btn"].forEach(id=>$(id).disabled=false);
  }
  async function findRoute() {
    const button=$("find-btn");
    button.disabled=true;button.innerHTML="<span>Finding route…</span>";
    note("Looking up locations and requesting road routes…");
    try {
      const response=await fetch("/api/route",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        origin:$("origin").value,destination:$("destination").value,mode:$("mode").value,preference:$("preference").value,
        mileage:$("mileage").value,fuel_price:$("fuel-price").value
      })});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Route request failed.");
      latestData=data;selectedRoute=0;drawRoutes(data);renderCards(data);
      note("Route options ready. Times are estimates; live traffic is unavailable.","success");
      const history=storage.get("history");history.unshift({origin:$("origin").value,destination:$("destination").value,mode:data.mode,preference:data.preference,at:new Date().toLocaleString()});storage.set("history",history.slice(0,20));
    } catch(e){note(e.message||"Could not calculate the route. Please try again.","error");}
    finally {button.disabled=false;button.innerHTML="<span>Find route</span><span>↗</span>";}
  }
  $("route-form").addEventListener("submit",e=>{e.preventDefault();findRoute()});
  $("compare-btn").addEventListener("click",()=>{if(latestData){$("results-section").scrollIntoView({behavior:"smooth"});note("Compare the distance, time and estimated cost on each route card.","success")}else findRoute()});
  $("reset-btn").addEventListener("click",()=>{$("destination").value="";$("mode").value="car";$("preference").value="balanced";latestData=null;overlays.clearLayers();originMarker.addTo(overlays);map.setView([college.lat,college.lon],11);showEmpty("No routes yet");$("results-subtitle").textContent="Results will appear here after a route search.";["save-btn","export-btn","share-btn"].forEach(id=>$(id).disabled=true);note("Enter a destination to get started.");});
  $("fit-btn").addEventListener("click",()=>{if(latestData&&latestData.routes[0]?._bounds)map.fitBounds(latestData.routes[0]._bounds.pad(.15));else map.setView([college.lat,college.lon],11)});
  $("fullscreen-btn").addEventListener("click",async()=>{const el=$(".map-column");try{if(!document.fullscreenElement)await el.requestFullscreen();else await document.exitFullscreen();setTimeout(()=>map.invalidateSize(),150)}catch(e){note("Full screen is not available in this browser.")}});
  $("save-btn").addEventListener("click",()=>{if(!latestData)return;const saved=storage.get("saved");saved.unshift({origin:latestData.origin.name,destination:latestData.destination.name,mode:latestData.mode,preference:latestData.preference,routes:latestData.routes,at:new Date().toLocaleString()});storage.set("saved",saved.slice(0,30));note("Route saved on this device.","success");renderSaved()});
  $("export-btn").addEventListener("click",async()=>{if(!latestData)return;const res=await fetch("/api/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({routes:latestData.routes,preference:latestData.preference})});const blob=await res.blob();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="route-summary.csv";a.click();URL.revokeObjectURL(a.href)});
  $("share-btn").addEventListener("click",async()=>{if(!latestData)return;const r=latestData.routes[selectedRoute||0];const text=`Route Planner: ${latestData.origin.name} → ${latestData.destination.name}\nDistance: ${r.distance_km} km · Estimated time: ${r.duration_min} min · Estimated fuel cost: ₹${r.cost_inr}\nLive traffic unavailable.`;try{if(navigator.share)await navigator.share({title:"Route summary",text});else{await navigator.clipboard.writeText(text);note("Route summary copied to clipboard.","success")}}catch(e){note("Sharing was cancelled or unavailable.")}});
  function renderList(id,items,type){const el=$(id);el.innerHTML="";if(!items.length){el.innerHTML='<div class="empty-state"><strong>Nothing here yet</strong><p>Your routes will appear here when available.</p></div>';return}items.forEach((item,i)=>{const row=document.createElement("div");row.className="saved-item";const left=document.createElement("div");const title=document.createElement("strong");title.textContent=(item.origin||"Start")+" → "+(item.destination||"Destination");const p=document.createElement("p");p.textContent=`${item.mode||"car"} · ${item.preference||"balanced"} · ${item.at||""}`;left.append(title,p);const btn=document.createElement("button");btn.className="btn secondary small";btn.textContent=type==="history"?"Use destination":"Remove";btn.onclick=()=>{if(type==="history"){$("destination").value=item.destination||"";activate("plan")}else{items.splice(i,1);storage.set(type,items);renderSaved()}};row.append(left,btn);el.appendChild(row)})}
  function renderSaved(){renderList("saved-list",storage.get("saved"),"saved");renderList("history-list",storage.get("history"),"history")}
  $("clear-history").addEventListener("click",()=>{if(confirm("Clear route history from this browser?")){storage.set("history",[]);renderSaved()}});
  $("save-settings").addEventListener("click",()=>{localStorage.setItem("rp_mileage",$("mileage").value);localStorage.setItem("rp_fuel",$("fuel-price").value);localStorage.setItem("rp_units",$("units").value);$("settings-feedback").textContent="Settings saved.";setTimeout(()=>$("settings-feedback").textContent="",2500)});
  $("mileage").value=localStorage.getItem("rp_mileage")||"15";$("fuel-price").value=localStorage.getItem("rp_fuel")||"100";$("units").value=localStorage.getItem("rp_units")||"km";
  function activate(view){document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("view-plan").classList.toggle("hidden",view!=="plan");$("results-section").classList.toggle("hidden",view!=="plan");["saved","history","settings"].forEach(v=>$("view-"+v).classList.toggle("hidden",view!==v));if(view==="saved"||view==="history")renderSaved();setTimeout(()=>map.invalidateSize(),100)}
  document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>activate(b.dataset.view)));
  let suggestionTimer;
  $("destination").addEventListener("input",()=>{clearTimeout(suggestionTimer);const q=$("destination").value.trim();if(q.length<3){$("suggestions").classList.add("hidden");return}suggestionTimer=setTimeout(async()=>{try{const res=await fetch("/api/suggest?q="+encodeURIComponent(q));const items=await res.json();const box=$("suggestions");box.innerHTML="";items.forEach(item=>{const div=document.createElement("div");div.className="suggestion";div.textContent=item.name;div.onclick=()=>{$("destination").value=item.name;box.classList.add("hidden")};box.appendChild(div)});box.classList.toggle("hidden",!items.length)}catch(e){$("suggestions").classList.add("hidden")}},450)});
  document.addEventListener("click",e=>{if(!e.target.closest(".destination"))$("suggestions").classList.add("hidden")});
  $("mode").addEventListener("change",()=>{if($("mode").value==="bus")note("Bus routing is unavailable in the current provider. Choose car, bike, or walking.","error");else note("Ready to find a route.")});
  renderSaved();
})();
