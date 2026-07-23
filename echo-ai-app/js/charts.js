function drawRadar(canvas, labels, datasets) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) / 2 - 34;
  const n = labels.length;
  const angleFor = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  ctx.clearRect(0, 0, w, h);

  // rings
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = angleFor(i % n);
      const r = (radius * ring) / 4;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // axes + labels
  ctx.fillStyle = "rgba(157,155,181,.9)";
  ctx.font = "11px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const a = angleFor(i);
    const x = cx + Math.cos(a) * radius, y = cy + Math.sin(a) * radius;
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    const lx = cx + Math.cos(a) * (radius + 16), ly = cy + Math.sin(a) * (radius + 16);
    ctx.fillText(labels[i], lx, ly);
  }

  datasets.forEach(({ values, color, fill }) => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const a = angleFor(idx);
      const r = radius * Math.max(0, Math.min(1, values[idx]));
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill || color.replace("1)", ".18)");
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawSparkline(canvas, values, color = "#ff5f96") {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!values.length) return;
  const min = Math.min(...values) - 5, max = Math.max(...values) + 5;
  const span = Math.max(max - min, 1);
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w;
    const y = h - ((v - min) / span) * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();
}
