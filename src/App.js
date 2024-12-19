import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HealthDiagnosisApp from "./components/HealthDiagnosisApp";

function App() {
  return (
    <div className="container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HealthDiagnosisApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
