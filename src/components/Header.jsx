// src/components/Header.jsx
import { Link } from 'react-router-dom'
import logo from '../assets/images/muscle_icon.webp'
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
      <h1 className="header-text">LockedIn</h1>

        <img
          src={logo}
          alt="PeakForm muscle icon"
          className="muscle-icon"
        />
      </div>

      <nav className="nav nav-right">
        <Link to="/">Home</Link>
        <Link to="/choose-workout">Choose Workout</Link>
        <Link to="/signup">Sign Up</Link>
      </nav>
    </header>
  )
}