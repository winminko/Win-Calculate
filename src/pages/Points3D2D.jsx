import React, { useEffect, useRef, useState } from "react";

export default function Points2DOnly() {
  const cvsRef = useRef(null);
  const [pts, setPts] = useState([]);        // {E,N,H,name}
  const [form, setForm] = useState({ E: "", N: "", H: "" });
  const [info, setInfo] = useState('No points yet. Enter E,N,H and tap "Add Point".');
  const [sel, setSel] = useState({ a: null, b: null });

  useEffect(() => draw(), [pts, sel]);

  const addPoint = () => {
    const E = parseFloat(form.E);
    const N = parseFloat(form.N);
    const H = form.H === "" ? "" : parseFloat(form.H); // H ကို 그대로 သိမ်း (မတွက်)
    if (!Number.isFinite(E) || !Number.isFinite(N)) {
      alert("Enter valid E and N.");
      return;
    }
    const name = `P${pts.length + 1}`;
    setPts([...pts, { E, N, H, name }]);
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
    return { x, y, scale, pad };
  };

  const draw = () => {
    const c = cvsRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    // light grid
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#f1f5f9";
    for (let i = 0; i < c.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, c.height); ctx.stroke(); }
    for (let j = 0; j < c.height; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(c.width, j); ctx.stroke(); }

    const { x, y } = fit();

    // selected line
    if (sel.a !== null && sel.b !== null) {
      const A = pts[sel.a], B = pts[sel.b];
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x(A.E), y(A.N)); ctx.lineTo(x(B.E), y(B.N)); ctx.stroke();
    }

    // points + labels
    pts.forEach((p, i) => {
      const sx = x(p.E), sy = y(p.N);
      const r = (i === sel.a || i === sel.b) ? 6 : 5;
      ctx.fillStyle = (i === sel.a || i === sel.b) ? "#6c5ce7" : "#111";
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#475569"; ctx.fillText(p.name, sx + 8, sy - 6);
    });

    // info text
    if (sel.a !== null && sel.b !== null) {
      const A = pts[sel.a], B = pts[sel.b];
      const dE = B.E - A.E, dN = B.N - A.N, dEN = Math.hypot(dE, dN);
      let bearing = Math.atan2(dN, dE) * 180 / Math.PI; if (bearing < 0) bearing += 360;

      // H ကို **မတွက်** — A, B တိုင်းရဲ့ input တန်ဖိုးကိုပဲ ပြ
      const hA = (A.H === "" || !Number.isFinite(A.H)) ? "-" : A.H;
      const hB = (B.H === "" || !Number.isFinite(B.H)) ? "-" : B.H;

      const text =
`A=${A.name}  B=${B.name}
ΔE=${dE.toFixed(3)} , ΔN=${dN.toFixed(3)} , dEN=${dEN.toFixed(3)}
Bearing=${bearing.toFixed(3)}°
H(A)=${hA} , H(B)=${hB}`;
      setInfo(text);
    }
  };

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

  useEffect(() => {
    const c = cvsRef.current;
    const resize = () => {
      const box = c.parentElement.getBoundingClientRect();
      c.width = Math.floor(box.width);
      c.height = Math.floor(box.width * 0.62);
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="page">
      <div className="stage2d" onClick={onPick}>
        <canvas ref={cvsRef} />
      </div>

      <div className="card">
        <h3>Points • 2D (EN only) • H is shown as input value</h3>
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
