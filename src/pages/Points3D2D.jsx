import React, { useEffect, useRef, useState } from "react";

export default function Points2D() {
  const cvsRef = useRef(null);
  const [pts, setPts] = useState([]); // {E,N,H,name}
  const [form, setForm] = useState({ E: "", N: "", H: "" });
  const [sel, setSel] = useState([]);

  useEffect(() => { drawAll(); }, [pts, sel]);

  const addPoint = () => {
    const E = parseFloat(form.E), N = parseFloat(form.N);
    const H = form.H === "" ? "" : parseFloat(form.H);
    if (!Number.isFinite(E) || !Number.isFinite(N)) return;
    const name = `P${pts.length+1}`;
    setPts([...pts, {E,N,H,name}]);
    setForm({E:"",N:"",H:""});
  };

  const clearAll = () => { setPts([]); setSel([]); };

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
    const n1=Math.hypot(v1x,v1y), n2=Math.hypot(v2x,v2y);
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

    // draw lines / labels
    if(sel.length===2){
      const A=pts[sel[0]],B=pts[sel[1]];
      if(A&&B){
        ctx.strokeStyle="#222"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(x(A.E),y(A.N)); ctx.lineTo(x(B.E),y(B.N)); ctx.stroke();
        const d=Math.hypot(B.E-A.E,B.N-A.N);
        drawLabel(ctx,`d=${d.toFixed(3)}`, (x(A.E)+x(B.E))/2, (y(A.N)+y(B.N))/2);
      }
    }
    if(sel.length===3){
      const A=pts[sel[0]],V=pts[sel[1]],C=pts[sel[2]];
      if(A&&V&&C){
        // arms
        ctx.strokeStyle="#222"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(x(V.E),y(V.N)); ctx.lineTo(x(A.E),y(A.N)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x(V.E),y(V.N)); ctx.lineTo(x(C.E),y(C.N)); ctx.stroke();
        // angle arc
        const ang=angleDegAt(A,V,C);
        drawLabel(ctx,`∠=${ang.toFixed(2)}°`, x(V.E)+20, y(V.N)-20);
      }
    }

    // points
    pts.forEach((p,i)=>{
      ctx.beginPath();
      ctx.arc(x(p.E),y(p.N),5,0,2*Math.PI);
      ctx.fillStyle= sel.includes(i)? "#6c5ce7":"#111";
      ctx.fill();
      ctx.fillStyle="#444"; ctx.fillText(p.name,x(p.E)+6,y(p.N)-6);
    });
  };

  const pick=(ev)=>{
    if(!pts.length) return;
    const rect=cvsRef.current.getBoundingClientRect();
    const cx=ev.clientX-rect.left, cy=ev.clientY-rect.top;
    const {x,y}=fit();
    let hit=-1, dmin=12;
    pts.forEach((p,i)=>{
      const d=Math.hypot(x(p.E)-cx,y(p.N)-cy);
      if(d<dmin){dmin=d;hit=i;}
    });
    if(hit===-1) return;
    if(sel.length===0) setSel([hit]);
    else if(sel.length===1) setSel([...sel,hit]);
    else if(sel.length===2) setSel([...sel,hit]); // 3 pts angle
    else setSel([hit]); // reset
  };

  return (
    <div className="page">
      <div className="stage2d" onClick={pick}>
        <canvas ref={cvsRef} style={{width:"100%",height:"400px",border:"1px solid #ccc",borderRadius:"8px"}} />
      </div>
      <div className="card">
        <div className="row">
          <label>E:<input value={form.E} onChange={e=>setForm({...form,E:e.target.value})}/></label>
          <label>N:<input value={form.N} onChange={e=>setForm({...form,N:e.target.value})}/></label>
          <label>H:<input value={form.H} onChange={e=>setForm({...form,H:e.target.value})}/></label>
          <button className="btn ok" onClick={addPoint}>Add</button>
          <button className="btn danger" onClick={clearAll}>Clear</button>
        </div>
        <ul>
          {pts.map((p,i)=><li key={i}>{p.name}: E={p.E}, N={p.N}, H={p.H}</li>)}
        </ul>
      </div>
    </div>
  );
    }
