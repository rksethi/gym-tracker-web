import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ActiveWorkout from "./pages/ActiveWorkout";
import Library from "./pages/Library";
import History from "./pages/History";
import SessionDetail from "./pages/SessionDetail";
import Templates from "./pages/Templates";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/templates" element={<Templates />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<SessionDetail />} />
      </Route>
      <Route path="/workout/:id" element={<ActiveWorkout />} />
    </Routes>
  );
}
