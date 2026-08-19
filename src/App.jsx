// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Header from './components/Header'
import ChooseWorkout from './pages/ChooseWorkout'
import ExerciseDetail from './pages/ExerciseDetail'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/choose-workout" element={<ChooseWorkout />} />
        <Route path="/exercise/:exerciseId" element={<ExerciseDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App