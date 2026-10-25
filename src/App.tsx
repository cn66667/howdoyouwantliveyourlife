import { Navigate, Route, Routes } from "react-router-dom";
import Circle from "./routes/Circle";
import Ending from "./routes/Ending";
import Home from "./routes/Home";
import Play from "./routes/Play";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:figureId" element={<Play />} />
      <Route path="/play/:figureId/end" element={<Ending />} />
      <Route path="/circle/:figureId" element={<Circle />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
