import React, { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";

export default function Points2D() {
  const cvsRef = useRef(null);
  const [pts, setPts] = useState([]);
  const [form, setForm] = useState({ E: "", N: "", H: "" });
  const [sel, setSel] = useState([]);
  const [dims, setDims] = useState([]); // {type:'seg'|'ang', pts:[...]}

  const addPoint = () => {
    const E = parseFloat(form.E), N = parseFloat(form.N);
    const H = form.H === "" ? "" : parseFloat(form.H);
    if (!Number.isFinite(E) || !Number.isFinite(N)) return;
    const name = `P${pts.length + 1}`;
    setPts([...pts, { E, N, H, name }]);
    setForm({ E: "", N: "", H: "" });
  };

  const deletePoint = (idx) => {
    // Remove the point
    const newPts = pts.filter((_, i) => i !== idx);
    // Remove annotations that referenced that point
    const newDims = dims.filter(d => d.pts.every(i => i !== idx));
    // Also remap indices because pts array shrinks
    const remap = (arr) => arr.map(i => (i > idx ? i - 1 : i));
    const fixedDims = newDims.map(d => ({ ...d, pts: remap(d.pts) }));
    setPts(newPts);
    setDims(fixedDims);
    setSel([]);
  };

  const clearAll = () => { setPts([]); setSel([]); setDims([]); };
  const undo = () => { setDims(d => d.slice(0, -1)); };
  const savePDF = () => {
    const element = document.getElementById("canvas-wrapper");
    html2pdf().from(element).set({ filename: "points2d.pdf", margin: 10 }).save();
  };

  const fit = () => {
    const c = cvsRef.current, pad = 40;
    let minE=0,maxE=1,minN=0,maxN=1;
    if(pts.length){ 
      minE=Math.min(...pts.map(p=>p.E)); maxE=Math.max(...pts.map(p=>p.E));
      minN=Math.min(...pts.map(p=>p.N)); maxN=Math.max(...pts.map(p=>p.N));
    }
    if(maxE===minE){maxE++;minE--;} if(maxN===minN){maxN++;minN--;}
    const scale=Math.min((c.width-2*pad)/(maxE-minE),(c.height-2*pad)/(maxN-minN));
    const x=E=>pad+(E-minE)*scale;
    const y=N=>c.height-(pad+(N-minN)*scale);
    return {x,y};
  };

  const angleDegAt=(A,V,C)=>{
    const v1x=A.E-V.E,v1y=A.N-V.N,v2x=C.E-V.E,v2y=C.N-V.N;
    const dot=v1x*v2x+v1y*v2y;
    const n1=Math.hypot(v1x,v1y),n2=Math.hypot(v2x,v2y);
    if(!n1||!n2) return 0;
    const cos=Math.min(1,Math.max(-1,dot/(n1*n2)));
    return (Math.acos(cos)*180/Math.PI);
  };

  const drawLabel=(ctx,text,x,y)=>{
    ctx.font="12px sans-serif";
    const w=ctx.measureText(text).width+8,h=16;
    ctx.fillStyle="#fff"; ctx.strokeStyle="#ccc";
    ctx.fillRect(x-w/2,y-h,w,h);
    ctx.strokeRect(x-w/2,y-h,w,h);
    ctx.fillStyle="#111"; ctx.fillText(text,x-w/2+4,y-4);
  };

  const drawAll=()=>{
    const c=cvsRef.current; if(!c) return;
    const ctx=c.getContext("2d");
    c.width=c.clientWidth; c.height=c.clientHeight;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height);

    const {x,y}=fit();

    // draw dimensions
    dims.forEach(d=>{
      if(d.type==="seg"){
        const A=pts[d.pts[0]],B=pts[d.pts[1]];
        if(A&&B){
          ctx.strokeStyle="#222"; ctx.beginPath();
          ctx.moveTo(x(A.E),y(A.N)); ctx.lineTo(x(B.E),y(B.N)); ctx.stroke();
          const dist=Math.hypot(B.E-A.E,B.N-A.N);
          drawLabel(ctx,`d=${dist.toFixed(3)}`,(x(A.E)+x(B.E))/2,(y(A.N)+y(B.N))/2);
        }
      }
      if(d.type==="ang"){
        const A=pts[d.pts[0]],V=pts[d.pts[1]],C=pts[d.pts[2]];
        if(A&&V&&C){
          ctx.strokeStyle="#222";
          ctx.beginPath(); ctx.moveTo(x(V.E),y(V.N)); ctx.lineTo(x(A.E),y(A.N)); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x(V.E),y(V.N)); ctx.lineTo(x(C.E),y(C.N)); ctx.stroke();
          const ang=angleDegAt(A,V,C);
          drawLabel(ctx,`∠=${ang.toFixed(2)}°`,x(V.E)+20,y(V.N)-20);
        }
      }
    });

    // draw points
    pts.forEach((p,i)=>{
      ctx.beginPath(); ctx.arc(x(p.E),y(p.N),5,0,2*Math.PI);
      ctx.fillStyle= sel.includes(i)? "#6c5ce7":"#111";
      ctx.fill();
      ctx.fillStyle="#444"; ctx.fillText(p.name,x(p.E)+6,y(p.N)-6);
    });
  };

  useEffect(()=>{ drawAll(); },[pts,dims,sel]);

  const pick=(ev)=>{
    if(!pts.length) return;
    const rect=cvsRef.current.getBoundingClientRect();
    const cx=ev.clientX-rect.left, cy=ev.clientY-rect.top;
    const {x,y}=fit();
    let hit=-1,dmin=12;
    pts.forEach((p,i)=>{
      const d=Math.hypot(x(p.E)-cx,y(p.N)-cy);
      if(d<dmin){dmin=d;hit=i;}
    });
    if(hit===-1) return;

    if(sel.length===0) setSel([hit]);
    else if(sel.length===1){ setDims([...dims,{type:"seg",pts:[sel[0],hit]}]); setSel([]); }
    else if(sel.length===2){ setDims([...dims,{type:"ang",pts:[sel[0],sel[1],hit]}]); setSel([]); }
    else setSel([hit]);
  };

  return (
    <div className="page">
      <div className="card" style={{marginBottom:8}}>
        <div className="row" style={{gap:8,flexWrap:"wrap"}}>
          <button className="btn" onClick={undo}>Undo</button>
          <button className="btn danger" onClick={clearAll}>Clear All</button>
          <button className="btn" style={{marginLeft:"auto"}} onClick={savePDF}>Save PDF</button>
        </div>
      </div>

      <div id="canvas-wrapper" className="stage2d" onClick={pick}>
        <canvas ref={cvsRef} style={{width:"100%",height:"400px",border:"1px solid #ccc",borderRadius:"8px"}} />
      </div>

      <div className="card">
        <div className="row">
          <label>E:<input value={form.E} onChange={e=>setForm({...form,E:e.target.value})}/></label>
          <label>N:<input value={form.N} onChange={e=>setForm({...form,N:e.target.value})}/></label>
          <label>H:<input value={form.H} onChange={e=>setForm({...form,H:e.target.value})}/></label>
          <button className="btn ok" onClick={addPoint}>Add</button>
        </div>
        <ul>
          {pts.map((p,i)=>(
            <li key={i}>
              {p.name}: E={p.E}, N={p.N}, H={p.H} 
              <button className="btn danger" style={{marginLeft:"8px"}} onClick={()=>deletePoint(i)}>❌</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
    }
