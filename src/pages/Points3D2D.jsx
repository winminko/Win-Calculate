import React, { useEffect, useRef, useState } from "react";

const load = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error("failed " + src));
    document.body.appendChild(s);
  });

export default function Points3D2D() {
  const wrapRef = useRef(null);
  const [en, setEN] = useState({ E: "", N: "", H: "" });
  const [log, setLog] = useState("Loading 3D engine…");
  const [mode2D, setMode2D] = useState(false);
  const apiRef = useRef(null);

  useEffect(() => {
    let renderer, labelRenderer, camera, controls, scene, group, link, onResize;
    (async () => {
      try {
        await load("https://unpkg.com/three@0.158.0/build/three.min.js");
        await load("https://unpkg.com/three@0.158.0/examples/js/controls/OrbitControls.js");
        await load("https://unpkg.com/three@0.158.0/examples/js/renderers/CSS2DRenderer.js");
        const THREE = window.THREE;

        const root = wrapRef.current;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
          55,
          root.clientWidth / root.clientHeight,
          0.1,
          2000
        );
        camera.position.set(8, 6, 8);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(root.clientWidth, root.clientHeight);
        root.appendChild(renderer.domElement);

        labelRenderer = new THREE.CSS2DRenderer();
        labelRenderer.setSize(root.clientWidth, root.clientHeight);
        labelRenderer.domElement.style.position = "absolute";
        labelRenderer.domElement.style.inset = "0";
        labelRenderer.domElement.style.pointerEvents = "none";
        root.appendChild(labelRenderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const dl = new THREE.DirectionalLight(0xffffff, 0.45);
        dl.position.set(3, 5, 4);
        scene.add(dl);
        scene.add(new THREE.GridHelper(200, 200, 0x999999, 0xdddddd));
        scene.add(new THREE.AxesHelper(6));

        const ptGeo = new THREE.SphereGeometry(0.12, 24, 24);
        const ptMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        group = new THREE.Group();
        link = new THREE.Group();
        scene.add(group);
        scene.add(link);

        const label = (t) => {
          const el = document.createElement("div");
          el.className = "lbl";
          el.textContent = t;
          return new THREE.CSS2DObject(el);
        };

        let selA = null,
          selB = null;
        const drawLine = () => {
          link.clear();
          if (!selA || !selB) return;
          const g = new THREE.BufferGeometry().setFromPoints([
            selA.position.clone(),
            selB.position.clone(),
          ]);
          link.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x333333 })));
        };

        const nearest = (cx, cy) => {
          const r = renderer.domElement.getBoundingClientRect();
          let best = null,
            dmin = 28;
          group.children.forEach((m) => {
            const v = m.position.clone().project(camera);
            const sx = (v.x * 0.5 + 0.5) * r.width;
            const sy = (-v.y * 0.5 + 0.5) * r.height;
            const d = Math.hypot(sx - cx, sy - cy);
            if (d < dmin) {
              dmin = d;
              best = m;
            }
          });
          return best;
        };

        renderer.domElement.addEventListener("pointerup", (e) => {
          const rect = renderer.domElement.getBoundingClientRect();
          const hit = nearest(e.clientX - rect.left, e.clientY - rect.top);
          if (!hit) return;
          if (!selA) {
            selA = hit;
            selA.scale.setScalar(1.28);
          } else if (!selB && hit !== selA) {
            selB = hit;
            selB.scale.setScalar(1.28);
            drawLine();
          } else {
            selA && selA.scale.setScalar(1);
            selB && selB.scale.setScalar(1);
            selA = hit;
            selB = null;
            link.clear();
            selA.scale.setScalar(1.28);
          }
          showInfo();
        });

        const showInfo = () => {
          if (!selA || !selB) {
            setLog("Select 2 points to measure.");
            return;
          }
          const A = selA.position,
            B = selB.position;
          const dE = B.x - A.x,
            dN = B.y - A.y,
            dH = B.z - A.z;
          const dEN = Math.hypot(dE, dN),
            d3 = Math.hypot(dEN, dH);
          let plan = (Math.atan2(dN, dE) * 180) / Math.PI;
          if (plan < 0) plan += 360;
          const elev = (Math.atan2(dH, dEN) * 180) / Math.PI;
          let t = `ΔE=${dE.toFixed(3)}, ΔN=${dN.toFixed(3)}, ΔH=${dH.toFixed(3)}
Plan dEN=${dEN.toFixed(3)} | 3D=${d3.toFixed(3)}
Plan angle=${plan.toFixed(3)}° | Elevation=${elev.toFixed(3)}°`;
          if (mode2D) t += `\n[2D] dEN=${dEN.toFixed(3)} | Bearing=${plan.toFixed(3)}°`;
          setLog(t);
        };

        // public API for React buttons
        apiRef.current = {
          add(E, N, H) {
            const id = `P${group.children.length + 1}`;
            const m = new THREE.Mesh(ptGeo, ptMat);
            m.position.set(E, N, H);
            m.add(label(id));
            group.add(m);
            setLog(`Added ${id} (${E}, ${N}, ${H}). Tap 2 points to measure.`);
          },
          clear() {
            group.clear();
            link.clear();
            setLog("Cleared. Add points again.");
          },
        };

        const render = () => {
          controls.update();
          renderer.render(scene, camera);
          labelRenderer.render(scene, camera);
          requestAnimationFrame(render);
        };
        render();

        onResize = () => {
          const w = wrapRef.current.clientWidth;
          const h = wrapRef.current.clientHeight;
          renderer.setSize(w, h);
          labelRenderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", onResize);

        setLog("3D ready • Add points below.");
      } catch (err) {
        setLog("3D engine failed: " + err.message);
      }
    })();

    return () => window.removeEventListener("resize", onResize || (() => {}));
  }, [mode2D]);

  const add = () => {
    const E = parseFloat(en.E) || 0;
    const N = parseFloat(en.N) || 0;
    const H = parseFloat(en.H) || 0;
    apiRef.current?.add(E, N, H);
    setEN({ E: "", N: "", H: "" });
  };

  return (
    <div className="page">
      <div ref={wrapRef} className="stage" />
      <div className="panel">
        <h3>Points • tap=select • 2-fingers zoom/pan/rotate</h3>
        <div className="row">
          <label>E:<input type="number" value={en.E} onChange={(e)=>setEN({...en,E:e.target.value})}/></label>
          <label>N:<input type="number" value={en.N} onChange={(e)=>setEN({...en,N:e.target.value})}/></label>
          <label>H:<input type="number" value={en.H} onChange={(e)=>setEN({...en,H:e.target.value})}/></label>
          <button className="btn ok" onClick={add}>Add Point</button>
          <button className="btn danger" onClick={()=>apiRef.current?.clear()}>Clear All</button>
          <label style={{marginLeft:"auto"}}><input type="checkbox" checked={mode2D} onChange={(e)=>setMode2D(e.target.checked)}/> 2D EN mode</label>
        </div>
        <pre className="info">{log}</pre>
      </div>
    </div>
  );
    }
