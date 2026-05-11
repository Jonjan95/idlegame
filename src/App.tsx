import { Routes, Route } from "react-router-dom";
import { GameProvider } from "./context/GameContext";
import Navbar from "./components/Navbar";
import Notifications from "./components/Notifications";
import Home from "./pages/Home";
import Woodcutting from "./pages/Woodcutting";
import Mining from "./pages/Mining";
import Inventory from "./pages/Inventory";
import Shop from "./pages/Shop";

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/woodcutting" element={<Woodcutting />} />
          <Route path="/mining" element={<Mining />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/shop" element={<Shop />} />
        </Routes>
        <Notifications />
      </div>
    </GameProvider>
  );
}
