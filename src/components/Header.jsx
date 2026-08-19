// src/components/Header.jsx

import logo from '../assets/images/muscle_icon.webp'
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <h1 className="header-text">PeakForm Coach</h1>

        <img
          src={logo}
          alt="PeakForm muscle icon"
          className="muscle-icon"
        />
      </div>

      <nav className="nav nav-right">
        <a href="/">Home</a>
        <a href="/choose-workout">Choose Workout</a>
        <a href="/signup">Sign Up</a>
      </nav>
    </header>
  )
}