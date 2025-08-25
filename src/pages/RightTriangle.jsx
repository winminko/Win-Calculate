import React, { useState } from "react";
const d2r = (d) => (d * Math.PI) / 180, r2d = (r) => (r * 180) / Math.PI;

export default function RightTriangle(){
  const [a,setA]=useState(""), [b,setB]=useState(""), [c,setC]=useState(""),
        [A,setAngA]=useState(""), [B,setAngB]=useState("");
  const [out,setOut]=useState(null);
  const f = (x)=>Number.isFinite(x);

  const solve=()=>{
    const va=parseFloat(a), vb=parseFloat(b), vc=parseFloat(c), vA=parseFloat(A), vB=parseFloat(B);

    if(f(va)&&f(vb)){ const cc=Math.hypot(va,vb), AA=r2d(Math.atan2(va,vb)), BB=90-AA; return setOut({a:va,b:vb,c:cc,A:AA,B:BB}); }
    if(f(va)&&f(vc) && vc>va){ const bb=Math.sqrt(vc*vc-va*va), AA=r2d(Math.asin(va/vc)), BB=90-AA; return setOut({a:va,b:bb,c:vc,A:AA,B:BB}); }
    if(f(vb)&&f(vc) && vc>vb){ const aa=Math.sqrt(vc*vc-vb*vb), BB=r2d(Math.asin(vb/vc)), AA=90-BB; return setOut({a:aa,b:vb,c:vc,A:AA,B:BB}); }
    if(f(vc)&&f(vA)){ const aa=vc*Math.sin(d2r(vA)), bb=vc*Math.cos(d2r(vA)); return setOut({a:aa,b:bb,c:vc,A:vA,B:90-vA}); }
    if(f(vc)&&f(vB)){ const bb=vc*Math.sin(d2r(vB)), aa=vc*Math.cos(d2r(vB)); return setOut({a:aa,b:bb,c:vc,A:90-vB,B:vB}); }
    if(f(va)&&f(vA)){ const bb=va/Math.tan(d2r(vA)), cc=va/Math.sin(d2r(vA)); return setOut({a:va,b:bb,c:cc,A:vA,B:90-vA}); }
    if(f(vb)&&f(vB)){ const aa=vb*Math.tan(d2r(vB)), cc=vb/Math.cos(d2r(vB)); return setOut({a:aa,b:vb,c:cc,A:90-vB,B:vB}); }

    alert("Fill any valid pair: (a,b) or (a,c) or (b,c) or (c,A) or (c,B) or (a,A) or (b,B)");
  };

  return (
    <div className="page">
      <div className="card">
        <h3>Right Triangle</h3>
        <div className="row">
          <label>a:<input type="number" value={a} onChange={e=>setA(e.target.value)}/></label>
          <label>b:<input type="number" value={b} onChange={e=>setB(e.target.value)}/></label>
          <label>c:<input type="number" value={c} onChange={e=>setC(e.target.value)}/></label>
          <label>A(°):<input type="number" value={A} onChange={e=>setAngA(e.target.value)}/></label>
          <label>B(°):<input type="number" value={B} onChange={e=>setAngB(e.target.value)}/></label>
          <button className="btn ok" onClick={solve}>Solve</button>
          <button className="btn" onClick={()=>{setA("");setB("");setC("");setAngA("");setAngB("");setOut(null);}}>Clear</button>
        </div>

        {out && (
          <>
            <pre className="info">
{`a=${out.a.toFixed(3)}, b=${out.b.toFixed(3)}, c=${out.c.toFixed(3)}
A=${out.A.toFixed(3)}°, B=${out.B.toFixed(3)}°, (C=90°)`}
            </pre>
            <TriangleSVG a={out.a} b={out.b}/>
          </>
        )}
      </div>
    </div>
  );
}

function TriangleSVG({a,b}){
  const W=340,H=140,p=18,k=(Math.min(W,H)-2*p)/Math.max(a,b,1);
  const Ax=p,Ay=H-p,Bx=p+b*k,By=H-p,Cx=p+b*k,Cy=H-p-a*k,r=16;
  const sAx=Ax+r,sAy=Ay,vACx=Cx-Ax,vACy=Cy-Ay,LAC=Math.hypot(vACx,vACy)||1,uACx=vACx/LAC,uACy=vACy/LAC,eAx=Ax+uACx*r,eAy=Ay+uACy*r;
  const sBx=Cx,sBy=Cy+r,vCAx=Ax-Cx,vCAy=Ay-Cy,LCA=Math.hypot(vCAx,vCAy)||1,uCAx=vCAx/LCA,uCAy=vCAy/LCA,eBx=Cx+uCAx*r,eBy=Cy+uCAy*r;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="box">
      <polyline points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Ax},${Ay}`} fill="none" stroke="currentColor" strokeWidth="2"/>
      <rect x={Bx-10} y={By-10} width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <text x={(Ax+Bx)/2} y={Ay-6} fontSize="12" textAnchor="middle">b</text>
      <text x={Bx+6} y={(By+Cy)/2} fontSize="12">a</text>
      <text x={(Ax+Cx)/2} y={(Ay+Cy)/2-8} fontSize="12" textAnchor="middle">c</text>
      <path d={`M ${sAx} ${sAy} A 16 16 0 0 1 ${eAx} ${eAy}`} fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d={`M ${sBx} ${sBy} A 16 16 0 0 1 ${eBx} ${eBy}`} fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <text x={Ax+(eAx-Ax)*0.6} y={Ay+(eAy-Ay)*0.6-4} fontSize="12">A</text>
      <text x={Cx+(eBx-Cx)*0.6+4} y={Cy+(eBy-Cy)*0.6} fontSize="12">B</text>
    </svg>
  );
    }
