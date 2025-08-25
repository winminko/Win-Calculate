import React from "react";
import { Link } from "react-router-dom";

export default function Home(){
  return (
    <div className="card">
      <h2>Survey Tools • Win-Calculate</h2>
      <p>တစ်ခုချင်း သွားလိုက်ပါ—</p>
      <ul className="menu">
        <li><Link to="/points">Points 3D / 2D (EN)</Link></li>
        <li><Link to="/circle">Circle Center (Adjusted & Best-fit)</Link></li>
        <li><Link to="/right">Right Triangle Solver</Link></li>
      </ul>
      <p className="muted">Add to Home Screen လုပ်နိုင်ပါတယ် (PWA ready).</p>
    </div>
  );
          }
