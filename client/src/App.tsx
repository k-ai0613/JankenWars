import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { OnlineGamePage } from './pages/OnlineGamePage';
import { Home } from './pages/home';
import NotFound from './pages/not-found';
import '@fontsource/inter';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/online" element={<OnlineGamePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
