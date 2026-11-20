import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import CognitivePage from './pages/cognitive/CognitivePage';
import VPAPage from './pages/cognitive/vpa/VPAPage';
import MSTPage from './pages/cognitive/mst/MSTPage';
import SPSPage from './pages/cognitive/sps/SPSPage';
import FERPage from './pages/cognitive/fer/FERPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cognitive" replace />} />
        <Route path="/cognitive" element={<CognitivePage />} />
        <Route path="/cognitive/vpa" element={<VPAPage />} />
        <Route path="/cognitive/mst" element={<MSTPage />} />
        <Route path="/cognitive/sps" element={<SPSPage />} />
        <Route path="/cognitive/fer" element={<FERPage />} />
      </Routes>
    </BrowserRouter>
  );
}
