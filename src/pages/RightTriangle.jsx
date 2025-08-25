import React, { useState } from "react";

export default function RightTriangle() {
  const [a, setA] = useState("");   // base (adjacent to A)
  const [b, setB] = useState("");   // height (opposite to A)
  const [A, setAngA] = useState(""); // angle A (deg) at bottom-left
  const [B, setAngB] = useState(""); // angle B (deg) at top-left
  const [out, setOut] = useState(null);
  const toNum = v => (v === "" ? NaN : Number(v));

  const solve = () => {
    let av = toNum(a), bv = toNum(b), Adeg = toNum(A), Bdeg = toNum(B);

    // normalize angles if both given
    if (Number.isFinite(Adeg) && !Number.isFinite(Bdeg)) Bdeg = 90 - Adeg;
    if (!Number.isFinite(Adeg) && Number.isFinite(Bdeg)) Adeg = 90 - Bdeg;

    // cases
    if (Number.isFinite(av) && Number.isFinite(bv)) {
      const cv = Math.hypot(av, bv);
      const A2 = Math.atan2(bv, av) * 180 / Math.PI;
      setOut({ a: av, b: bv, c: cv, A: A2, B: 90 - A2 });
      return;
    }
    if (Number.isFinite(av) && Number.isFinite(Adeg)) {
      const rad = Adeg * Math.PI / 180;
      const bv2 = av * Math.tan(rad);
      const cv = av / Math.cos(rad);
      setOut({ a: av, b: bv2, c: cv, A: Adeg, B: 90 - Adeg });
      return;
    }
    if (Number.isFinite(bv) && Number.isFinite(Adeg)) {
      const rad = Adeg * Math.PI / 180;
      const av2 = bv / Math.tan(rad);
      const cv = bv / Math.sin(rad);
      setOut({ a: av2, b: bv, c: cv, A: Adeg, B: 90 - Adeg });
      return;
    }
    if (Number.isFinite(av) && Number.isFinite(Bdeg)) {
      const rad = (90 - Bdeg) * Math.PI / 180;
      const bv2 = av * Math.tan(rad);
      const cv = av / Math.cos(rad);
      setOut({ a: av, b: bv2, c: cv, A: 90 - Bdeg, B: Bdeg });
      return;
    }
    if (Number.isFinite(bv) && Number.isFinite(Bdeg)) {
      const rad = (90 - Bdeg) * Math.PI / 180;
      const av2 = bv / Math.tan(rad);
      const cv = bv / Math.sin(rad);
      setOut({ a: av2, b: bv, c: cv, A: 90 - Bdeg, B: Bdeg });
      return;
    }
    alert("ထည့်ထားတဲ့တန်ဖိုး ၂ ခုတော့လိုပါတယ် (a,b) သို့မဟုတ် (a, A°) စတာတွေ)!");
  };

  const clearAll = () => { setA(""); setB(""); setAngA(""); setAngB(""); setOut(null); };

  const fmt = (v) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 });

  return (
    <div className="page">
      {/* ► Diagram: အမြဲပေါ်နေ */}
      <div className="card" style={{maxWidth: 720, marginInline: "auto"}}>
        <h3>Right Triangle</h3>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div style={{background:"#fff", border:"1px solid var(--line)", borderRadius:12, padding:16}}>
            {/* Static SVG diagram (not recomputed) */}
            <svg viewBox="0 0 320 220" width="100%" height="auto">
              {/* triangle */}
              <polygon points="40,180 280,180 40,40" fill="#eef" stroke="#6c5ce7" strokeWidth="2"/>
              {/* right angle marker */}
              <path d="M40 160 L60 160 L60 180" fill="none" stroke="#111" strokeWidth="2"/>
              {/* labels */}
              <text x="160" y="200" fontSize="14" fill="#111">a (base)</text>
              <text x="10" y="110" fontSize="14" fill="#111" transform="rotate(-90 20,110)">b (height)</text>
              <text x="180" y="90" fontSize="14" fill="#111">c (hypotenuse)</text>
              <text x="54" y="192" fontSize="13" fill="#555">A°</text>
              <text x="28" y="52" fontSize="13" fill="#555">B°</text>
            </svg>
          </div>

          {/* Inputs */}
          <div>
            <div className="row">
              <label>a:<input type="number" value={a} onChange={e=>setA(e.target.value)} /></label>
            </div>
            <div className="row">
              <label>b:<input type="number" value={b} onChange={e=>setB(e.target.value)} /></label>
            </div>
            <div className="row">
              <label>A(°):<input type="number" value={A} onChange={e=>setAngA(e.target.value)} /></label>
            </div>
            <div className="row">
              <label>B(°):<input type="number" value={B} onChange={e=>setAngB(e.target.value)} /></label>
            </div>

            <div className="row" style={{marginTop:8, gap:8}}>
              <button className="btn ok" onClick={solve}>Solve</button>
              <button className="btn danger" onClick={clearAll}>Clear</button>
            </div>

            {/* Results (numbers only) */}
            {out && (
              <div className="box" style={{marginTop:12}}>
                <div><b>a</b> = {fmt(out.a)}</div>
                <div><b>b</b> = {fmt(out.b)}</div>
                <div><b>c</b> = {fmt(out.c)}</div>
                <div><b>A</b> = {fmt(out.A)}°</div>
                <div><b>B</b> = {fmt(out.B)}°</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
    }
