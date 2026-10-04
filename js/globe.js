/* Hero globe: the Earth at night, drawn on a <canvas> with no libraries.
   Coastlines and borders glow in gold, and big cities shine.
   It turns slowly by itself. When the visitor picks a country on the
   placard, it rotates to that country and marks it with a pin. */
(function () {
  const canvas = document.getElementById("globe");
  if (!canvas || !canvas.getContext || typeof BORDERS === "undefined") return;
  const ctx = canvas.getContext("2d");
  const RAD = Math.PI / 180;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rough centre of each country in the placard list: [longitude, latitude]
  const CENTRES = {
    "India": [79, 22], "Brazil": [-52, -10], "Japan": [138, 37], "France": [2, 47], "Kenya": [38, 0],
    "Germany": [10, 51], "Egypt": [30, 27], "Mexico": [-102, 23], "South Africa": [24, -29],
    "United Kingdom": [-2, 54], "Indonesia": [117, -2], "Argentina": [-64, -35], "Nigeria": [8, 9],
    "Australia": [134, -25], "Canada": [-100, 57], "Türkiye": [35, 39], "Norway": [9, 61], "Vietnam": [106, 16]
  };

  // Big cities, used for the bright spots: [longitude, latitude]
  const CITIES = [[72.9,19.1],[77.2,28.6],[88.4,22.6],[80.3,13.1],[77.6,13],[67,24.9],[90.4,23.8],[116.4,39.9],[121.5,31.2],
    [114.2,22.3],[139.7,35.7],[135.5,34.7],[127,37.6],[100.5,13.8],[106.8,-6.2],[103.8,1.4],[121,14.6],[106.7,10.8],
    [55.3,25.3],[51.4,35.7],[44.4,33.3],[46.7,24.7],[35.2,31.8],[31.2,30],[29,41],[37.6,55.8],[30.3,59.9],[30.5,50.5],
    [21,52.2],[13.4,52.5],[2.4,48.9],[-0.1,51.5],[4.9,52.4],[-3.7,40.4],[12.5,41.9],[9.2,45.5],[16.4,48.2],[18.1,59.3],
    [23.7,38],[3.4,6.5],[-0.2,5.6],[36.8,-1.3],[38.7,9],[28,-26.2],[18.4,-33.9],[13.2,-8.8],[15.3,-4.3],[-7.6,33.6],
    [-74,40.7],[-87.6,41.9],[-118.2,34.1],[-122.4,37.8],[-95.4,29.8],[-79.4,43.7],[-73.6,45.5],[-99.1,19.4],[-80.2,25.8],
    [-46.6,-23.6],[-43.2,-22.9],[-58.4,-34.6],[-70.7,-33.5],[-77,-12],[-74.1,4.7],[-66.9,10.5],[151.2,-33.9],[145,-37.8]];

  // Pre-compute what never changes: sin/cos of every point's latitude
  const cityRad = CITIES.map((c) => [c[0] * RAD, c[1] * RAD]);
  const borders = BORDERS.map((line) => {
    const pts = [];
    for (let i = 0; i < line.length; i += 2) {
      const lat = line[i + 1] / 10 * RAD;
      pts.push({ lon: line[i] / 10 * RAD, sin: Math.sin(lat), cos: Math.cos(lat) });
    }
    return pts;
  });
  const cities = cityRad.map((c) => ({ lon: c[0], sin: Math.sin(c[1]), cos: Math.cos(c[1]) }));

  // A soft glowing spot, drawn once and then stamped for every city
  const glowSprite = document.createElement("canvas");
  glowSprite.width = glowSprite.height = 64;
  const g = glowSprite.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 244, 214, 1)");
  grad.addColorStop(0.18, "rgba(255, 214, 140, .75)");
  grad.addColorStop(1, "rgba(255, 190, 90, 0)");
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);

  let size = 0;                 // canvas width in CSS pixels
  let lon0 = 45 * RAD;          // longitude facing the viewer
  let lat0 = 16 * RAD;          // tilt
  let sinLat0 = 0, cosLat0 = 1;
  let target = null;            // [lon, lat] in radians when a country is chosen
  let visible = true;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    size = canvas.clientWidth;
    canvas.width = canvas.height = Math.round(size * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Orthographic projection: where a point on the sphere lands on the flat circle.
  // out.z > 0 means the point is on the side facing us.
  const out = { x: 0, y: 0, z: 0 };
  function project(p) {
    const dl = p.lon - lon0, cosDl = Math.cos(dl);
    out.z = sinLat0 * p.sin + cosLat0 * p.cos * cosDl;
    out.x = p.cos * Math.sin(dl);
    out.y = cosLat0 * p.sin - sinLat0 * p.cos * cosDl;
    return out;
  }

  function strokeBorders(c, r) {
    ctx.beginPath();
    for (const line of borders) {
      let drawing = false;
      for (const pt of line) {
        const p = project(pt);
        if (p.z <= 0.02) { drawing = false; continue; }   // behind the globe: lift the pen
        if (drawing) ctx.lineTo(c + p.x * r, c - p.y * r); else ctx.moveTo(c + p.x * r, c - p.y * r);
        drawing = true;
      }
    }
    ctx.stroke();
  }

  function draw(time) {
    const c = size / 2, r = size * 0.43;
    sinLat0 = Math.sin(lat0); cosLat0 = Math.cos(lat0);
    ctx.clearRect(0, 0, size, size);
    ctx.globalAlpha = 1;

    // halo behind the globe, then the dark night-side sphere
    const halo = ctx.createRadialGradient(c, c, r * 0.9, c, c, r * 1.18);
    halo.addColorStop(0, "rgba(200, 165, 90, .28)"); halo.addColorStop(1, "rgba(200, 165, 90, 0)");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(c, c, r * 1.18, 0, 7); ctx.fill();
    const sphere = ctx.createRadialGradient(c - r * 0.3, c - r * 0.35, r * 0.1, c, c, r);
    sphere.addColorStop(0, "#0d1d38"); sphere.addColorStop(1, "#030912");
    ctx.fillStyle = sphere; ctx.beginPath(); ctx.arc(c, c, r, 0, 7); ctx.fill();

    // fine gold rings around the globe
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(200, 165, 90, .9)"; ctx.stroke();
    ctx.strokeStyle = "rgba(200, 165, 90, .32)";
    ctx.beginPath(); ctx.ellipse(c, c, r * 1.14, r * 0.3, -22 * RAD, 0, 7); ctx.stroke();

    // coastlines and borders: a wide faint stroke under a thin bright one makes them glow
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255, 190, 90, .16)"; ctx.lineWidth = Math.max(2.5, size / 150); strokeBorders(c, r);
    ctx.strokeStyle = "rgba(255, 221, 160, .8)"; ctx.lineWidth = Math.max(0.6, size / 800); strokeBorders(c, r);

    // city lights
    ctx.globalCompositeOperation = "lighter";
    const glow = size / 26;
    for (const city of cities) {
      const p = project(city);
      if (p.z <= 0.05) continue;
      ctx.globalAlpha = 0.25 + p.z * 0.6;
      const s = glow * (0.5 + p.z * 0.6);
      ctx.drawImage(glowSprite, c + p.x * r - s / 2, c - p.y * r - s / 2, s, s);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // pin on the chosen country
    if (target) {
      const p = project(target);
      if (p.z > 0) {
        const x = c + p.x * r, y = c - p.y * r;
        const pulse = reduceMotion ? 0.5 : (time / 1600) % 1;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, " + (1 - pulse).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(x, y, 7 + pulse * 18, 0, 7); ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7); ctx.fill();
        ctx.fillStyle = "#0b1f3f"; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill();
      }
    }
  }

  function frame(time) {
    if (visible) {
      if (target) { // ease towards the chosen country, taking the shorter way round
        let diff = (target.lon - lon0) % (2 * Math.PI);
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        lon0 += diff * 0.06;
        lat0 += (target.lat * 0.6 - lat0) * 0.06;
      } else {
        lon0 += 0.0016; // slow idle spin
      }
      draw(time);
    }
    requestAnimationFrame(frame);
  }

  function setCountry(name) {
    const centre = CENTRES[name];
    target = centre ? { lon: centre[0] * RAD, lat: centre[1] * RAD, sin: Math.sin(centre[1] * RAD), cos: Math.cos(centre[1] * RAD) } : null;
    if (reduceMotion) { // no animation: jump straight there and draw once
      if (target) { lon0 = target.lon; lat0 = target.lat * 0.6; }
      draw(0);
    }
  }

  const select = document.getElementById("delegateCountry");
  select.addEventListener("change", () => setCountry(select.value));
  window.addEventListener("resize", () => { resize(); draw(0); });
  // stop drawing when the globe is scrolled out of view
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);

  resize();
  setCountry(select.value);
  draw(0);
  if (!reduceMotion) requestAnimationFrame(frame);
})();
