/* Hero globe: the Earth at night, drawn on a <canvas> with no libraries.
   - Coastlines and borders glow in gold and big cities shine.
   - It turns slowly by itself. Drag it to turn it yourself.
   - Point at a country to see its name; click it to put it on your placard.
   - Choosing a country in the dropdown turns the globe to that country. */
(function () {
  const canvas = document.getElementById("globe");
  if (!canvas || !canvas.getContext || typeof BORDERS === "undefined") return;
  const ctx = canvas.getContext("2d");
  const tip = document.getElementById("globeTip");
  const select = document.getElementById("delegateCountry");
  const RAD = Math.PI / 180;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Big cities, used for the bright spots: [longitude, latitude]
  const CITIES = [[72.9,19.1],[77.2,28.6],[88.4,22.6],[80.3,13.1],[77.6,13],[67,24.9],[90.4,23.8],[116.4,39.9],[121.5,31.2],
    [114.2,22.3],[139.7,35.7],[135.5,34.7],[127,37.6],[100.5,13.8],[106.8,-6.2],[103.8,1.4],[121,14.6],[106.7,10.8],
    [55.3,25.3],[51.4,35.7],[44.4,33.3],[46.7,24.7],[35.2,31.8],[31.2,30],[29,41],[37.6,55.8],[30.3,59.9],[30.5,50.5],
    [21,52.2],[13.4,52.5],[2.4,48.9],[-0.1,51.5],[4.9,52.4],[-3.7,40.4],[12.5,41.9],[9.2,45.5],[16.4,48.2],[18.1,59.3],
    [23.7,38],[3.4,6.5],[-0.2,5.6],[36.8,-1.3],[38.7,9],[28,-26.2],[18.4,-33.9],[13.2,-8.8],[15.3,-4.3],[-7.6,33.6],
    [-74,40.7],[-87.6,41.9],[-118.2,34.1],[-122.4,37.8],[-95.4,29.8],[-79.4,43.7],[-73.6,45.5],[-99.1,19.4],[-80.2,25.8],
    [-46.6,-23.6],[-43.2,-22.9],[-58.4,-34.6],[-70.7,-33.5],[-77,-12],[-74.1,4.7],[-66.9,10.5],[151.2,-33.9],[145,-37.8]];

  // Turn a flat list [lon, lat, lon, lat, ...] (degrees x10) into points ready for projecting.
  // sin and cos of the latitude never change, so they are worked out once here.
  function toPoints(list) {
    const pts = [];
    for (let i = 0; i < list.length; i += 2) {
      const lat = list[i + 1] / 10 * RAD;
      pts.push({ lon: list[i] / 10 * RAD, sin: Math.sin(lat), cos: Math.cos(lat) });
    }
    return pts;
  }
  const borders = BORDERS.map(toPoints);
  const cities = CITIES.map((c) => ({ lon: c[0] * RAD, sin: Math.sin(c[1] * RAD), cos: Math.cos(c[1] * RAD) }));
  const outlines = new Map(); // country name -> its outline rings as points (made when first needed)
  const outlineOf = (country) => {
    if (!outlines.has(country.n)) outlines.set(country.n, country.r.map(toPoints));
    return outlines.get(country.n);
  };

  let size = 0;                 // canvas width in CSS pixels
  let lon0 = 45 * RAD;          // longitude facing the viewer
  let lat0 = 16 * RAD;          // tilt
  let sinLat0 = 0, cosLat0 = 1;
  let chosen = null;            // the selected country (an item of COUNTRIES)
  let pin = null;               // its centre as a point
  let following = false;        // true while the globe is turning towards the chosen country
  let hovered = null;           // country under the pointer
  let drag = null;              // { x, y, moved } while a finger or mouse is held down
  let fling = 0;                // turning speed left over from a flick
  let idleUntil = 0;            // no automatic spin before this time (after the visitor has dragged)
  let visible = true;

  // Performance: the finished globe picture is kept on a hidden canvas ("scene").
  // It is only redrawn when something actually changes (rotation, hover, choice, size).
  // On slow devices the globe also switches to a lighter drawing mode by itself.
  const scene = document.createElement("canvas");
  const sctx = scene.getContext("2d");
  let ratio = 1, sceneKey = "", lite = false, slowFrames = 0, tick = 0;

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, lite ? 1 : 2);
    size = canvas.clientWidth;
    canvas.width = canvas.height = scene.width = scene.height = Math.round(size * ratio);
    sceneKey = "";
  }
  const centre = () => size / 2, radius = () => size * 0.43;

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

  // The same sum run backwards: which longitude and latitude is under a point on the canvas?
  function unproject(px, py) {
    const x = (px - centre()) / radius(), y = -(py - centre()) / radius();
    const d = x * x + y * y;
    if (d > 1) return null; // outside the globe
    const z = Math.sqrt(1 - d);
    const lat = Math.asin(Math.max(-1, Math.min(1, y * cosLat0 + z * sinLat0)));
    let lon = lon0 + Math.atan2(x, z * cosLat0 - y * sinLat0);
    lon = ((lon / RAD + 540) % 360) - 180;
    return [lon * 10, lat / RAD * 10]; // same units as the map data
  }

  // Classic "ray casting" test: is the point inside this outline?
  function inRing(ring, x, y) {
    let inside = false;
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function countryAt(px, py) {
    const at = unproject(px, py);
    if (!at) return null;
    return COUNTRIES.find((c) => c.r.some((ring) => inRing(ring, at[0], at[1]))) || null;
  }

  function tracePath(ctx, lines, c, r, close) {
    ctx.beginPath();
    for (const line of lines) {
      let drawing = false;
      for (const pt of line) {
        const p = project(pt);
        if (p.z <= 0.02) { drawing = false; continue; }   // behind the globe: lift the pen
        if (drawing) ctx.lineTo(c + p.x * r, c - p.y * r); else ctx.moveTo(c + p.x * r, c - p.y * r);
        drawing = true;
      }
      if (close && drawing) ctx.closePath();
    }
  }

  function drawScene(c, r) {
    const ctx = sctx; // everything in this function is painted on the hidden canvas
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
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

    // the country under the pointer and the chosen country are filled in
    ctx.lineJoin = "round";
    if (hovered && hovered !== chosen) { tracePath(ctx, outlineOf(hovered), c, r, true); ctx.fillStyle = "rgba(255, 255, 255, .12)"; ctx.fill(); }
    if (chosen) { tracePath(ctx, outlineOf(chosen), c, r, true); ctx.fillStyle = "rgba(200, 165, 90, .34)"; ctx.fill(); }

    // coastlines and borders: a wide faint stroke under a thin bright one makes them glow
    tracePath(ctx, borders, c, r, false);
    if (!lite) { ctx.strokeStyle = "rgba(255, 190, 90, .16)"; ctx.lineWidth = Math.max(2.5, size / 150); ctx.stroke(); }
    ctx.strokeStyle = "rgba(255, 221, 160, .8)"; ctx.lineWidth = Math.max(0.6, size / 800); ctx.stroke();

    // city lights: three soft rings per city, each ring size painted in one go
    // (stamping a glow picture per city looked the same but was about ten times slower)
    const spots = [];
    for (const city of cities) {
      const p = project(city);
      if (p.z > 0.05) spots.push([c + p.x * r, c - p.y * r, (size / 60) * (0.5 + p.z * 0.6)]);
    }
    [[1, "rgba(255, 200, 110, .16)"], [0.55, "rgba(255, 214, 140, .38)"], [0.24, "rgba(255, 244, 214, .95)"]].forEach(([scale, colour]) => {
      ctx.beginPath();
      for (const s of spots) { ctx.moveTo(s[0] + s[2] * scale, s[1]); ctx.arc(s[0], s[1], s[2] * scale, 0, 7); }
      ctx.fillStyle = colour; ctx.fill();
    });
  }

  function draw(time) {
    const c = centre(), r = radius();
    sinLat0 = Math.sin(lat0); cosLat0 = Math.cos(lat0);
    // redraw the globe picture only if something changed since the last frame
    const key = [lon0.toFixed(4), lat0.toFixed(4), hovered && hovered.n, chosen && chosen.n, size, lite].join("|");
    const changed = key !== sceneKey, started = performance.now();
    if (changed) { drawScene(c, r); sceneKey = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(scene, 0, 0); // the browser does the real painting work here
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // three slow redraws in a row: switch to the lighter mode (thinner glow, fewer pixels)
    if (changed && !lite) {
      slowFrames = performance.now() - started > 12 ? slowFrames + 1 : 0;
      if (slowFrames >= 3) { lite = true; resize(); }
    }

    // pin on the chosen country
    if (pin) {
      const p = project(pin);
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
      if (following && pin && !drag) { // ease towards the chosen country, taking the shorter way round
        let diff = (pin.lon - lon0) % (2 * Math.PI);
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        lon0 += diff * 0.06;
        lat0 += (pin.lat * 0.6 - lat0) * 0.06;
        if (Math.abs(diff) < 0.002) { following = false; idleUntil = time + 6000; } // rest on the country, then turn again
      } else if (!drag && Math.abs(fling) > 0.0004) {
        lon0 -= fling; fling *= 0.94;       // the globe keeps turning for a moment after a flick
      } else if (!drag && time > idleUntil && tick % (lite ? 3 : 2) === 0) {
        lon0 += lite ? 0.0048 : 0.0032; // slow spin on its own, moved on every second (or third) frame to save work
      }
      tick += 1;
      draw(time);
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  function setCountry(name) {
    chosen = COUNTRIES.find((c) => c.n === name) || null;
    pin = chosen ? { lon: chosen.c[0] * RAD, lat: chosen.c[1] * RAD, sin: Math.sin(chosen.c[1] * RAD), cos: Math.cos(chosen.c[1] * RAD) } : null;
    following = !!chosen;
    if (reduceMotion) { // no animation: jump straight there and draw once
      if (pin) { lon0 = pin.lon; lat0 = pin.lat * 0.6; }
      draw(0);
    }
  }

  /* ----- pointer: hover, drag and click ----- */
  const local = (e) => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };

  canvas.addEventListener("pointerdown", (e) => {
    const [x, y] = local(e);
    if (!unproject(x, y)) return;          // pressed outside the sphere
    drag = { x: e.clientX, y: e.clientY, moved: 0, speed: 0 };
    fling = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    const [x, y] = local(e);
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      lon0 -= dx / radius();
      drag.speed = dx / radius();
      lat0 = Math.max(-1.2, Math.min(1.2, lat0 + dy / radius()));
      following = false;
      if (reduceMotion) draw(0);
      return;
    }
    hovered = countryAt(x, y);
    canvas.style.cursor = hovered ? "pointer" : unproject(x, y) ? "grab" : "";
    tip.hidden = !hovered;
    if (hovered) { tip.textContent = hovered.n; tip.style.left = x + "px"; tip.style.top = y + "px"; }
    if (reduceMotion) draw(0);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const wasClick = drag.moved < 6;
    if (!wasClick && !reduceMotion) fling = Math.max(-0.08, Math.min(0.08, drag.speed));
    drag = null;
    canvas.classList.remove("is-dragging");
    idleUntil = performance.now() + 1500;
    if (wasClick) {
      const [x, y] = local(e);
      const country = countryAt(x, y);
      if (country) { // put the clicked country on the placard; main.js listens for this change
        select.value = country.n;
        select.dispatchEvent(new Event("change"));
      }
    }
  });
  canvas.addEventListener("pointercancel", () => { drag = null; canvas.classList.remove("is-dragging"); });
  canvas.addEventListener("pointerleave", () => { hovered = null; tip.hidden = true; if (reduceMotion) draw(0); });

  select.addEventListener("change", () => setCountry(select.value));
  window.addEventListener("resize", () => { resize(); draw(0); });
  // stop drawing when the globe is scrolled out of view
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);

  resize();
  setCountry(select.value);
  draw(0);
  if (!reduceMotion) requestAnimationFrame(frame);
})();
