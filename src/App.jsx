import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Points3D2D from "./pages/Points3D2D.jsx";
import CircleCenter from "./pages/CircleCenter.jsx";
import RightTriangle from "./pages/RightTriangle.jsx";

export default function App(){
  const loc = useLocation();
  return (
    <div>
      <header className="appbar">
        <div className="title">Created By Mr.WIN MIN KO</div>
        <nav className="nav">
          <Link className={loc.pathname==="/points"?"tab active":"tab"} to="/points">1) Points 3D/2D</Link>
          <Link className={loc.pathname==="/circle"?"tab active":"tab"} to="/circle">2) Circle Center</Link>
          <Link className={loc.pathname==="/right"?"tab active":"tab"} to="/right">3) Right Triangle</Link>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/points" element={<Points3D2D/>} />
          <Route path="/circle" element={<CircleCenter/>} />
          <Route path="/right" element={<RightTriangle/>} />
        </Routes>
      </main>
    </div>
  );
          }
