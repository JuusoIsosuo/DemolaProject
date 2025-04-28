import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Home from './pages/Home';
import MultipleRoutes from './pages/MultipleRoutes';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/multiple-routes" element={<MultipleRoutes />} />
      </Routes>
    </Router>
  );
};

export default App;
