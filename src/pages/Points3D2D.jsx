import React, { useEffect, useRef, useState } from "react";

export default function Points2DOnly() {
  const cvsRef = useRef(null);
  const [pts, setPts] = useState([]);        // {E,N,H,name}
  const [form, setForm] = useState({ E: "", N: "", H: "" });
  const [info, setInfo] = useState('No points yet. Enter E,N,H and tap "Add Point".');
  const [sel, setSel] = useState({ a: null, b: null });

  // --- draw whenever points/selection change
  useEffect(() => draw(), [pts, sel]);

  // --- ensure canvas has real size (ResizeObserver + fallback)
  useEffect(() => {
    const c = cvsRef.current;
    const parent = c.parentElement;

    const setSize = () => {
      const box = parent.getBoundingClientRect();
      let w = Math.floor(box.width);
      if (!w || w < 10) w = 640;                // ✅ fallback width
      const h = Math.floor(w * 0.62);           // keep aspect
      c.width = w;
      c.height = h;
      draw();
    };

    // First paint
    setSize();

    // Watch for layout changes
    const ro = new ResizeObserver(setSize);
    ro.observe(parent);

    // Also a micro fallback after CSS loads
    const t = setTimeout(setSize, 0);

    return () => { ro.disconnect(); clearTimeout(t); };
    // eslint-disable-next-line
  }, []);

  const addPoint = () => {
    const E = parseFloat(form.E);
    const N = parseFloat(form.N);
    const H = form.H === "" ? "" : parseFloat(form.H); // show-only
    if (!Number.isFinite(E) || !Number.isFinite(N)) {
      alert("Enter valid E and N."); return;
    }
    const name = `P${pts.length + 1}`;
    setPts(prev => [...prev, { E, N, H, name }]);
    setForm({ E: "", N: "", H: "" });
    setInfo(`Added ${name} — E:${E}, N:${N}, H:${H === "" ? "-" : H}. Tap canvas to select.`);
  };

  const clearAll = () => {
    setPts([]); setSel({ a: null, b: null });
    setInfo('Cleared. Enter E,N,H and add again.');
  };

  const savePNG = () => {
    const url = cvsRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = "points-2d.png"; a.click();
  };

  // world->screen fit
  const fit = () => {
    const c = cvsRef.current, pad = 36;
    let minE = 0, maxE = 1, minN = 0, maxN = 1;
    if (pts.length) {
      minE = Math.min(...pts.map(p => p.E));
      maxE = Math.max(...pts.map(p => p.E));
      minN = Math.min(...pts.map(p => p.N));
      maxN = Math.max(...pts.map(p => p.N));
    }
    if (maxE === minE) { maxE += 1; minE -= 1; }
    if (maxN === minN) { maxN += 1; minN -= 1; }
    const scale = Math.min(
      (c.width - 2 * pad) / (maxE - minE),
      (c.height - 2 * pad) / (maxN - minN)
    );
    const x = (E) => pad + (E - minE) * scale;
    const y = (N) => c.height - (pad + (N - minN) * scale);
    return { x, y };
  };

  const draw = () => {
    const c = cvsRef.current; if (!c) return;
    const ctx = c.getContext("2d");

    // clear + bg
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);

    // grid
    ctx.strokeStyle = "#eef2f7";
    for (let i = 0; i < c.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, c.height); ctx.stroke(); }
    for (let j = 0; j < c.height; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(c.width, j); ctx.stroke(); }

    const { x, y } = fit();

    // line if selected
    if (sel.a !== null && sel.b !== null) {
      const A = pts[sel.a], B = pts[sel.b];
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x(A.E), y(A.N)); ctx.lineTo(x(B.E), y(B.N)); ctx.stroke();
    }

    // points
    ctx.font = "12px system-ui, Segoe UI, Roboto, sans-serif";
    pts.forEach((p, i) => {
      const sx = x(p.E), sy = y(p.N);
      const r = (i === sel.a || i === sel.b) ? 6 : 5;
      ctx.fillStyle = (i === sel.a || i === sel.b) ? "#6c5ce7" : "#111";
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#475569"; ctx.fillText(p.name, sx + 8, sy - 6);
    });

    // info
    if (sel.a !== null && sel.b !== null) {
      const A = pts[sel.a], B = pts[sel.b];
      const dE = B.E - A.E, dN = B.N - A.N, dEN = Math.hypot(dE, dN);
      let bearing = Math.atan2(dN, dE) * 180 / Math.PI; if (bearing < 0) bearing += 360;
      const hA = (A.H === "" || !Number.isFinite(A.H)) ? "-" : A.H;
      const hB = (B.H === "" || !Number.isFinite(B.H)) ? "-" : B.H;
      setInfo(
`A=${A.name}  B=${B.name}
ΔE=${dE.toFixed(3)} , ΔN=${dN.toFixed(3)} , dEN=${dEN.toFixed(3)}
Bearing=${bearing.toFixed(3)}°
H(A)=${hA} , H(B)=${hB}`
      );
    }
  };

  // pick nearest point on click
  const onPick = (ev) => {
    const rect = cvsRef.current.getBoundingClientRect();
    const cx = ev.clientX - rect.left, cy = ev.clientY - rect.top;
    const { x, y } = fit();
    let hit = -1, dmin = 18;
    pts.forEach((p, i) => {
      const d = Math.hypot(x(p.E) - cx, y(p.N) - cy);
      if (d < dmin) { dmin = d; hit = i; }
    });
    if (hit === -1) return;
    if (sel.a === null) setSel({ a: hit, b: null });
    else if (sel.b === null && hit !== sel.a) setSel({ a: sel.a, b: hit });
    else setSel({ a: hit, b: null });
  };

  return (
    <div className="page">
      <div className="stage2d" onClick={onPick}>
        <canvas ref={cvsRef} />
      </div>

      <div className="card">
        <h3>Points • 2D (EN only) • H is shown as your input</h3>
        <div className="row">
          <label>E:<input type="number" value={form.E} onChange={e=>setForm({...form,E:e.target.value})} /></label>
          <label>N:<input type="number" value={form.N} onChange={e=>setForm({...form,N:e.target.value})} /></label>
          <label>H:<input type="number" value={form.H} onChange={e=>setForm({...form,H:e.target.value})} /></label>
          <button className="btn ok" onClick={addPoint}>Add Point</button>
          <button className="btn danger" onClick={clearAll}>Clear All</button>
          <button className="btn" onClick={savePNG} style={{marginLeft:"auto"}}>Save Image (PNG)</button>
        </div>
        <pre className="info">{info}</pre>
      </div>
    </div>
  );
                                  }
