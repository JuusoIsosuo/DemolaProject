import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import './App.css'
import MapView from './pages/MapView.jsx'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapView />} />
      </Routes>
    </Router>
  )
}

export default App
