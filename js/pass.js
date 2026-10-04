/* Delegate pass: drawn on a <canvas> and saved as a PNG image. No libraries.
   The pass shows the delegate's name, country (with its outline), committee and a pass number. */

const PASS = { w: 1080, h: 1350, navy: "#0b1f3f", deep: "#06142b", gold: "#c8a55a", soft: "#e3cd98", white: "#ffffff" };

// A short, steady number made from the delegate's details (same input, same number)
function passNumber(text) {
  let hash = 7;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return "NM27-" + String(hash).padStart(5, "0");
}

// Shrink the font until the text fits the given width
function fitText(ctx, text, maxWidth, size, font) {
  do { ctx.font = font.replace("SIZE", size); size -= 2; } while (ctx.measureText(text).width > maxWidth && size > 20);
}

function spaced(ctx, text, x, y, spacing) { // centred text with wide letter spacing
  const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing);
  let cursor = x - (widths.reduce((a, b) => a + b, 0) - spacing) / 2;
  ctx.textAlign = "left";
  [...text].forEach((ch, i) => { ctx.fillText(ch, cursor, y); cursor += widths[i]; });
  ctx.textAlign = "center";
}

// The country's outline, scaled to fit inside a box
function drawOutline(ctx, country, cx, cy, box) {
  const rings = country.r.map((r) => { const pts = []; for (let i = 0; i < r.length; i += 2) pts.push([r[i] / 10, r[i + 1] / 10]); return pts; });
  // only the biggest pieces, so far-off islands do not shrink the mainland
  const size = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); };
  const biggest = Math.max(...rings.map(size));
  const keep = rings.filter((r) => size(r) > biggest * 0.08);
  const squeeze = Math.cos(country.c[1] * Math.PI / 180) || 1;      // longitude lines get closer away from the equator
  const all = keep.flat(), xs = all.map((p) => p[0] * squeeze), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = box / Math.max(maxX - minX, maxY - minY);
  const px = (p) => cx + (p[0] * squeeze - (minX + maxX) / 2) * scale, py = (p) => cy - (p[1] - (minY + maxY) / 2) * scale;

  ctx.beginPath();
  keep.forEach((ring) => { ring.forEach((p, i) => i ? ctx.lineTo(px(p), py(p)) : ctx.moveTo(px(p), py(p))); ctx.closePath(); });
  ctx.lineJoin = "round";
  ctx.fillStyle = "rgba(200, 165, 90, .14)"; ctx.fill();
  ctx.strokeStyle = "rgba(255, 190, 90, .25)"; ctx.lineWidth = 12; ctx.stroke();   // glow
  ctx.strokeStyle = "#ffdda0"; ctx.lineWidth = 2.5; ctx.stroke();
}

async function drawDelegatePass(canvas, entry) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready; // wait for the serif font
  const ctx = canvas.getContext("2d"), W = PASS.w, H = PASS.h, mid = W / 2;
  canvas.width = W; canvas.height = H;
  const serif = "'Cormorant Garamond', Georgia, serif", sans = "'Jost', 'Segoe UI', sans-serif";
  const country = COUNTRIES.find((c) => c.n === entry.country);

  // background and double gold frame
  const bg = ctx.createRadialGradient(W * 0.7, 0, 50, mid, H / 2, H);
  bg.addColorStop(0, "#17376b"); bg.addColorStop(0.5, PASS.navy); bg.addColorStop(1, PASS.deep);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = PASS.gold; ctx.lineWidth = 3; ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1; ctx.strokeRect(50, 50, W - 100, H - 100);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PASS.white; ctx.font = `500 30px ${sans}`;
  spaced(ctx, "NARSEE MONJEE MODEL UNITED NATIONS", mid, 150, 8);
  ctx.font = `600 150px ${serif}`;
  const title = "NMMUN", year = "'27", tw = ctx.measureText(title).width, yw = ctx.measureText(year).width;
  ctx.textAlign = "left";
  ctx.fillText(title, mid - (tw + yw) / 2, 300);
  ctx.fillStyle = PASS.gold; ctx.fillText(year, mid - (tw + yw) / 2 + tw, 300);
  ctx.textAlign = "center";
  ctx.fillStyle = PASS.gold; ctx.fillRect(mid - 60, 335, 120, 2);
  ctx.fillStyle = PASS.soft; ctx.font = `500 34px ${sans}`;
  spaced(ctx, "DELEGATE PASS", mid, 400, 12);

  // country outline inside a gold ring
  ctx.strokeStyle = "rgba(200, 165, 90, .5)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(mid, 610, 165, 0, 7); ctx.stroke();
  ctx.setLineDash([3, 9]); ctx.beginPath(); ctx.arc(mid, 610, 182, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  if (country) drawOutline(ctx, country, mid, 610, 215);

  ctx.fillStyle = PASS.soft; ctx.font = `italic 500 44px ${serif}`;
  ctx.fillText(country ? "The delegate of" : "Delegate", mid, 870);
  ctx.fillStyle = PASS.white;
  const countryText = (entry.country || "Country to be allotted").toUpperCase();
  fitText(ctx, countryText, W - 200, 104, `700 SIZEpx ${serif}`);
  ctx.fillText(countryText, mid, 970);
  ctx.fillStyle = PASS.gold; ctx.fillRect(mid - 220, 1005, 440, 1.5);
  ctx.fillStyle = PASS.white;
  fitText(ctx, entry.name.toUpperCase(), W - 240, 44, `500 SIZEpx ${sans}`);
  spaced(ctx, entry.name.toUpperCase(), mid, 1070, 6);
  ctx.fillStyle = PASS.soft; ctx.font = `italic 500 38px ${serif}`;
  ctx.fillText(entry.committee === "Not decided" ? "Committee to be allotted" : "Committee: " + entry.committee, mid, 1130);

  // footer strip
  ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(90, 1180, W - 180, 1);
  ctx.fillStyle = PASS.white; ctx.font = `400 28px ${sans}`; ctx.textAlign = "left";
  ctx.fillText("16 and 17 January 2027", 90, 1235);
  ctx.fillText("NMIMS Shirpur campus", 90, 1275);
  ctx.textAlign = "right";
  ctx.fillStyle = PASS.gold; ctx.font = `600 34px ${sans}`;
  ctx.fillText(passNumber(entry.name + entry.country + entry.email), W - 90, 1240);
  ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = `400 22px ${sans}`;
  ctx.fillText("Provisional pass. Not valid for entry.", W - 90, 1275);
}

function downloadDelegatePass(canvas, name) {
  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "NMMUN27-delegate-pass-" + (name.trim().replace(/\s+/g, "-") || "delegate") + ".png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, "image/png");
}
