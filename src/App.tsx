import { useState } from "react";
import Landing from "./components/Landing";
import { Market } from "./components/Market";

export default function App() {
  const [view, setView] = useState<"landing" | "market">("landing");

  if (view === "landing") return <Landing onEnter={() => setView("market")} />;

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <Market />
    </div>
  );
}
