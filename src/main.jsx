import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Routes, Route, Navigate} from "react-router";
import './index.css';
import {Login} from "@/Login.jsx";
import App from "./App";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path='/app' element={<App />} />
        </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
