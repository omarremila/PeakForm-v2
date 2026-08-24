// src/components/Header.jsx
import { Link } from 'react-router-dom'
import logo from '../assets/images/muscle_icon.webp'
import './Header.css'

export default function Header() {
  return (
    
   <header className="header">
  <Link to="/" className="header-logo">
    <img
      src={logo}
      alt=""
      aria-hidden="true"
      className="muscle-icon muscle-icon-mirrored"
    />
    <h1 className="header-text">LockedIn</h1>
    <img
      src={logo}
      alt="LockedIn muscle icon"
      className="muscle-icon"
    />
  </Link>

  <nav className="nav nav-right">
    <Link to="/">Home</Link>
    <Link to="/choose-workout">Choose Workout</Link>
  </nav>
</header>
  )
}