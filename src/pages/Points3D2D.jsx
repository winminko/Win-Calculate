import React, { useEffect, useRef, useState } from "react";

export default function Points2D() {
  const cvsRef = useRef(null);

  // points (world coords)
  const [pts, setPts] = useState([]); // {E,N,H,name}
  const [form, setForm] = useState({ E: "", N: "", H: "" });

  // measuring tool & selections
  const [tool, setTool] = useState("seg"); // 'seg' | 'ang'
  const [sel, setSel] = useState([]);      // selected indices (0..2)

  // persistent annotations
  const [segs, setSegs] = useState([]);    // [{i,j}]
  const [angs, setAngs] = useState([]);    // [{a,v,c}]
  const [hist, setHist] = useState([]);    // [{t:'seg'|'ang'}]

  const [info, setInfo] = useState('Points: Enter E,N,H → Add Point.  • Tool: "Segment" = tap 2 pts, "Angle" = tap 3 pts (A,Vertex,C).');

  // ---------- canvas sizing ----------
  useEffect(() => {
    const c = cvsRef.current, parent = c.parentElement;
    const setSize = () => {
      const box = parent.getBoundingClientRect();
      let w = Math.floor(box.width); if (!w || w < 10) w = 640;
      c.width = w; c.height = Math.floor(w * 0.62);
      drawAll();
    };
    setSize();
    const ro = new ResizeObserver(setSize); ro.observe(parent);
    const t = setTimeout(setSize, 0);
    return () => { ro.disconnect(); clearTimeout(t); };
    // eslint-disable-next-line
  }, []);

  // redraw whenever data changes
  useEffect(() => { drawAll(); /* eslint-disable-next-line */ }, [pts, segs, angs, sel, tool]);

  // ---------- helpers ----------
  const addPoint = () => {
    const E = parseFloat(form.E), N = parseFloat(form.N);
    const H = form.H === "" ? "" : parseFloat(form.H);
    if (!Number.isFinite(E) || !Number.isFinite(N)) return alert("Enter valid E and N.");
    const name = `P${pts.length + 1}`;
    setPts(p => [...p, { E, N, H, name }]);
    setForm({ E: "", N: "", H: "" });
    setInfo(`Added ${name}. Tool=${tool === "seg" ? "Segment(2 pts)" : "Angle(3 pts A,Vertex,C)"}`);
  };

  const clearPoints = () => {
    setPts([]); setSegs([]); setAngs([]); setHist([]); setSel([]);
    setInfo("Cleared points & annotations.");
  };
  const undo = () => {
    if (!hist.length) return;
    const last = hist[hist.length - 1];
    if (last.t === "seg") setSegs(s => s.slice(0, -1));
    else setAngs(a => a.slice(0, -1));
    setHist(h => h.slice(0, -1));
    setInfo("Undo last annotation.");
  };
  const clearAnn = () => { setSegs([]); setAngs([]); setHist([]); setInfo("Cleared annotations."); };

  const savePNG = () => {
    const url = cvsRef.current.toDataURL("image/png");
    const a = document.createElement("a"); a.href = url; a.download = "canvas-2d.png"; a.click();
  };

  // mapping world -> screen
  const fit = () => {
    const c = cvsRef.current, pad = 36;
    let minE = 0, maxE = 1, minN = 0, maxN = 1;
    if (pts.length) {
      minE = Math.min(...pts.map(p => p.E)); maxE = Math.max(...pts.map(p => p.E));
      minN = Math.min(...pts.map(p => p.N)); maxN = Math.max(...pts.map(p => p.N));
    }
    if (maxE === minE) { maxE += 1; minE -= 1; }
    if (maxN === minN) { maxN += 1; minN -= 1; }
    const scale = Math.min((c.width - 2 * pad) / (maxE - minE), (c.height - 2 * pad) / (maxN - minN));
    const x = (E) => pad + (E - minE) * scale;
    const y = (N) => c.height - (pad + (N - minN) * scale);
    return { x, y, scale };
  };

  // angle helpers
  const angleDegAt = (A, V, C) => {
    const v1x = A.E - V.E, v1y = A.N - V.N;
    const v2x = C.E - V.E, v2y = C.N - V.N;
    const dot = v1x * v2x + v1y * v2y;
    const n1 = Math.hypot(v1x, v1y), n2 = Math.hypot(v2x, v2y);
    if (!n1 || !n2) return 0;
    const cos = Math.min(1, Math.max(-1, dot / (n1 * n2)));
    return (Math.acos(cos) * 180) / Math.PI;
  };

  // ---------- drawing ----------
  const drawLabel = (ctx, text, sx, sy) => {
    ctx.font = "12px system-ui, Segoe UI, Roboto, sans-serif";
    const pad = 4, w = ctx.measureText(text).width + pad * 2, h = 16;
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#cbd5e1";
    ctx.beginPath(); ctx.rect(sx - w / 2, sy - h + 2, w, h);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillText(text, sx - w / 2 + pad, sy - h + 14);
  };

  const drawAll = () => {
    const c = cvsRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    const { x, y } = fit();

    // background + grid
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#eef2f7";
    for (let i = 0; i < c.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, c.height); ctx.stroke(); }
    for (let j = 0; j < c.height; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(c.width, j); ctx.stroke(); }

    // draw persistent segments
    ctx.lineWidth = 2;
    segs.forEach(({ i, j }) => {
      const A = pts[i], B = pts[j]; if (!A || !B) return;
      const x1 = x(A.E), y1 = y(A.N), x2 = x(B.E), y2 = y(B.N);
      ctx.strokeStyle = "#222";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      const dE = (B.E - A.E), dN = (B.N - A.N), dEN = Math.hypot(dE, dN);
      // label offset (normal)
      const vx = x2 - x1, vy = y2 - y1, L = Math.hypot(vx, vy) || 1;
      const nx = -vy / L, ny = vx / L;
      drawLabel(ctx, `dEN=${dEN.toFixed(3)}  ΔE=${dE.toFixed(3)}, ΔN=${dN.toFixed(3)}`, (x1 + x2) / 2 + nx * 12, (y1 + y2) / 2 + ny * 12);
    });

    // draw persistent angles
    angs.forEach(({ a, v, c: cc }) => {
      const A = pts[a], V = pts[v], C = pts[cc]; if (!A || !V || !C) return;
      const vx1 = x(A.E), vy1 = y(A.N), vx = x(V.E), vy = y(V.N), vx2 = x(C.E), vy2 = y(C.N);

      // arms
      ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx1, vy1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx2, vy2); ctx.stroke();

      // arc
      const a1 = Math.atan2(vy1 - vy, vx1 - vx);
      const a2 = Math.atan2(vy2 - vy, vx2 - vx);
      let d = a2 - a1; while (d <= -Math.PI) d += Math.PI * 2; while (d > Math.PI) d -= Math.PI * 2;
      const cw = d < 0; // draw minor arc
      const r = 28; // px
      ctx.strokeStyle = "#6c5ce7"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vx, vy, r, a1, a2, cw);
      ctx.stroke();

      const mid = a1 + (d / 2);
      drawLabel(ctx, `∠=${angleDegAt(A, V, C).toFixed(3)}°`, vx + Math.cos(mid) * (r + 14), vy + Math.sin(mid) * (r + 14));
    });

    // selection preview (dashed)
    if (sel.length) {
      ctx.setLineDash([6, 6]); ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
      if (tool === "seg" && sel.length === 1) {
        const A = pts[sel[0]];
        // guide to all other pts? keep simple: draw a small circle
        ctx.beginPath(); ctx.arc(x(A.E), y(A.N), 6, 0, Math.PI * 2); ctx.stroke();
      }
      if (tool === "ang") {
        sel.forEach(idx => { const P = pts[idx]; ctx.beginPath(); ctx.arc(x(P.E), y(P.N), 6, 0, Math.PI * 2); ctx.stroke(); });
      }
      ctx.setLineDash([]);
    }

    // points
    ctx.font = "12px system-ui, Segoe UI, Roboto, sans-serif";
    pts.forEach((p, i) => {
      const sx = x(p.E), sy = y(p.N);
      ctx.fillStyle = (sel.includes(i)) ? "#6c5ce7" : "#111";
      ctx.beginPath(); ctx.arc(sx, sy, sel.includes(i) ? 6 : 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#475569"; ctx.fillText(p.name, sx + 8, sy - 6);
    });
  };

  // ---------- picking ----------
  const pick = (ev) => {
    if (!pts.length) return;
    const rect = cvsRef.current.getBoundingClientRect();
    const cx = ev.clientX - rect.left, cy = ev.clientY - rect.top;
    const { x, y } = fit();
    let hit = -1, dmin = 18;
    pts.forEach((p, i) => {
      const d = Math.hypot(x(p.E) - cx, y(p.N) - cy);
      if (d < dmin) { dmin = d; hit = i; }
    });
    if (hit === -1) return;

    if (tool === "seg") {
      if (sel.length === 0) setSel([hit]);
      else if (sel.length === 1 && hit !== sel[0]) {
        // finalize segment
        setSegs(s => [...s, { i: sel[0], j: hit }]);
        setHist(h => [...h, { t: "seg" }]);
        const A = pts[sel[0]], B = pts[hit];
        setInfo(`Segment ${pts[sel[0]].name}-${pts[hit]].name}  •  ΔE=${(B.E-A.E).toFixed(3)}  ΔN=${(B.N-A.N).toFixed(3)}  dEN=${Math.hypot(B.E-A.E,B.N-A.N).toFixed(3)}  •  H(A)=${A.H === "" ? "-" : A.H}  H(B)=${B.H === "" ? "-" : B.H}`);
        setSel([]); // reset
      } else setSel([hit]);
    } else {
      // tool === 'ang'
      if (sel.length === 0) setSel([hit]);             // A
      else if (sel.length === 1) setSel([sel[0], hit]); // V?
      else if (sel.length === 2 && hit !== sel[1]) {
        // finalize angle with order: A, V, C
        setAngs(a => [...a, { a: sel[0], v: sel[1], c: hit }]);
        setHist(h => [...h, { t: "ang" }]);
        const A = pts[sel[0]], V = pts[sel[1]], C = pts[hit];
        const ang = angleDegAt(A, V, C).toFixed(3);
        setInfo(`Angle at ${V.name}: ∠=${ang}°  •  H(A)=${A.H===""?"-":A.H}  H(V)=${V.H===""?"-":V.H}  H(C)=${C.H===""?"-":C.H}`);
        setSel([]); // reset
      } else setSel([hit]);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{marginBottom:8}}>
        <div className="row" style={{gap:8,flexWrap:"wrap"}}>
          <button className={`btn ${tool==="seg"?"ok":""}`} onClick={()=>{setTool("seg");setSel([]);}}>Segment</button>
          <button className={`btn ${tool==="ang"?"ok":""}`} onClick={()=>{setTool("ang");setSel([]);}}>Angle</button>
          <button className="btn" onClick={undo}>Undo</button>
          <button className="btn" onClick={clearAnn}>Clear Annotations</button>
          <button className="btn danger" onClick={clearPoints}>Clear Points</button>
          <button className="btn" style={{marginLeft:"auto"}} onClick={savePNG}>Save Image (PNG)</button>
        </div>
      </div>

      <div className="stage2d" onClick={pick}>
        <canvas ref={cvsRef} />
      </div>

      <div className="card">
        <h3>Points • 2D (EN only). H is shown as input (not calculated).</h3>
        <div className="row">
          <label>E:<input type="number" value={form.E} onChange={e=>setForm({...form,E:e.target.value})}/></label>
          <label>N:<input type="number" value={form.N} onChange={e=>setForm({...form,N:e.target.value})}/></label>
          <label>H:<input type="number" value={form.H} onChange={e=>setForm({...form,H:e.target.value})}/></label>
          <button className="btn ok" onClick={addPoint}>Add Point</button>
        </div>
        <pre className="info" style={{whiteSpace:"pre-wrap"}}>{info}</pre>
      </div>
    </div>
  );
}
