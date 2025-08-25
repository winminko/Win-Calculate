import React, { useEffect, useRef, useState } from "react";

// three.js ကို CDN ဖြင့် dynamic load (bundler ပြဿနာရှောင်)
const load = (url) => new Promise((res, rej) => {
  const s = document.createElement("script"); s.src = url; s.onload = res; s.onerror = rej; document.body.appendChild(s);
});

export default function Points3D2D(){
  const wrapRef = useRef(null);
  const [en, setEN] = useState({E:"",N:"",H:""});
  const [log, setLog] = useState("Tap two points to show ΔE, ΔN, ΔH, Distance, Degree.");
  const [points, setPoints] = useState([]);
  const [mode2D, setMode2D] = useState(false);

  useEffect(() => {
    (async () => {
      await load("https://unpkg.com/three@0.158.0/build/three.min.js");
      await load("https://unpkg.com/three@0.158.0/examples/js/controls/OrbitControls.js");
      await load("https://unpkg.com/three@0.158.0/examples/js/renderers/CSS2DRenderer.js");

      const THREE = window.THREE;
      const root = wrapRef.current;
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(55, root.clientWidth/root.clientHeight, 0.1, 2000);
      cam.position.set(8,6,8);

      const r = new THREE.WebGLRenderer({antialias:true});
      r.setSize(root.clientWidth, root.clientHeight);
      root.appendChild(r.domElement);

      const l = new THREE.CSS2DRenderer();
      l.setSize(root.clientWidth, root.clientHeight);
      l.domElement.style.position="absolute"; l.domElement.style.inset="0"; l.domElement.style.pointerEvents="none";
      root.appendChild(l.domElement);

      const ctl = new THREE.OrbitControls(cam, r.domElement); ctl.enableDamping=true;
      scene.add(new THREE.AmbientLight(0xffffff,.9));
      const dl = new THREE.DirectionalLight(0xffffff,.45); dl.position.set(3,5,4); scene.add(dl);
      scene.add(new THREE.GridHelper(200,200,0x999999,0xdddddd)); scene.add(new THREE.AxesHelper(6));

      const ptGeo = new THREE.SphereGeometry(0.12, 24, 24);
      const ptMat = new THREE.MeshStandardMaterial({color:0x111111});
      const G = new THREE.Group(); scene.add(G);
      const link = new THREE.Group(); scene.add(link);

      let selA=null, selB=null;
      function drawLine(){
        link.clear();
        if(!selA || !selB) return;
        const g = new THREE.BufferGeometry().setFromPoints([selA.position.clone(), selB.position.clone()]);
        link.add(new THREE.Line(g, new THREE.LineBasicMaterial({color:0x333333})));
      }
      function label(text){
        const el = document.createElement("div"); el.className="lbl"; el.textContent=text;
        return new window.THREE.CSS2DObject(el);
      }

      function addPoint(E,N,H,name){
        const mesh = new THREE.Mesh(ptGeo, ptMat);
        mesh.position.set(E,N,H); mesh.userData.name = name;
        mesh.add(label(name)); G.add(mesh);
        return mesh;
      }

      // click select nearest
      r.domElement.addEventListener("pointerup",(e)=>{
        const rect = r.domElement.getBoundingClientRect();
        const cx=e.clientX-rect.left, cy=e.clientY-rect.top;
        let best=null, dmin=28;
        G.children.forEach(m=>{
          const v = m.position.clone().project(cam);
          const sx=(v.x*0.5+0.5)*rect.width, sy=(-v.y*0.5+0.5)*rect.height;
          const d=Math.hypot(sx-cx,sy-cy); if(d<dmin){dmin=d;best=m;}
        });
        if(best){
          if(!selA){ selA=best; best.scale.setScalar(1.28); }
          else if(!selB && best!==selA){ selB=best; best.scale.setScalar(1.28); drawLine(); }
          else { selA.scale.setScalar(1); selB && selB.scale.setScalar(1); selA=best; selB=null; drawLine(); best.scale.setScalar(1.28); }
          showInfo();
        }
      });

      const render = ()=>{ ctl.update(); r.render(scene,cam); l.render(scene,cam); requestAnimationFrame(render); };
      render();

      // expose helpers
      window.__pointsApi = {
        add(E,N,H){
          const id = `P${G.children.length+1}`;
          const m = addPoint(E,N,H,id);
          setPoints(prev => [...prev, {id,E,N,H}]);
        },
        clear(){
          G.clear(); link.clear(); selA=selB=null; setPoints([]); setLog("Cleared. Add points again.");
        }
      };

      function showInfo(){
        if(!selA || !selB){ setLog("Select 2 points to measure."); return;}
        const A=selA.position, B=selB.position;
        const dE=B.x-A.x, dN=B.y-A.y, dH=B.z-A.z;
        const dEN=Math.hypot(dE,dN), d3=Math.hypot(dEN,dH);
        let plan = Math.atan2(dN,dE)*180/Math.PI; if(plan<0) plan+=360;
        const elev = Math.atan2(dH,dEN)*180/Math.PI;
        const base = `ΔE=${dE.toFixed(3)}, ΔN=${dN.toFixed(3)}, ΔH=${dH.toFixed(3)}\nPlan dEN=${dEN.toFixed(3)} | 3D=${d3.toFixed(3)}\nPlan angle=${plan.toFixed(3)}° | Elevation=${elev.toFixed(3)}°`;
        if(mode2D) setLog(base + `\n[2D] dEN=${dEN.toFixed(3)} | Bearing=${plan.toFixed(3)}°`);
        else setLog(base);
      }

      const onResize = ()=>{ r.setSize(wrapRef.current.clientWidth, wrapRef.current.clientHeight); cam.aspect=wrapRef.current.clientWidth/wrapRef.current.clientHeight; cam.updateProjectionMatrix(); l.setSize(wrapRef.current.clientWidth, wrapRef.current.clientHeight); };
      window.addEventListener("resize", onResize);
      return ()=>window.removeEventListener("resize", onResize);
    })();
  }, [mode2D]);

  const add = ()=>{
    const E=parseFloat(en.E)||0, N=parseFloat(en.N)||0, H=parseFloat(en.H)||0;
    window.__pointsApi?.add(E,N,H);
    setEN({E:"",N:"",H:""});
  };
  const clear=()=>window.__pointsApi?.clear();

  return (
    <div className="page">
      <div ref={wrapRef} className="stage" />
      <div className="panel">
        <h3>Points • tap=select • 2-fingers zoom/pan/rotate</h3>
        <div className="row">
          <label>E:<input value={en.E} onChange={e=>setEN({...en,E:e.target.value})} type="number" step="0.1"/></label>
          <label>N:<input value={en.N} onChange={e=>setEN({...en,N:e.target.value})} type="number" step="0.1"/></label>
          <label>H:<input value={en.H} onChange={e=>setEN({...en,H:e.target.value})} type="number" step="0.1"/></label>
          <button className="btn ok" onClick={add}>Add Point</button>
          <button className="btn danger" onClick={clear}>Clear All</button>
          <label style={{marginLeft:"auto"}}><input type="checkbox" checked={mode2D} onChange={e=>setMode2D(e.target.checked)}/> 2D EN mode</label>
        </div>
        <pre className="info">{log}</pre>
        {points.length>0 && (
          <div className="list">{points.map(p=><div key={p.id}>{p.id}: ({p.E},{p.N},{p.H})</div>)}</div>
        )}
      </div>
    </div>
  );
    }
