import { useState } from "react";
import Landing from "./components/Landing";
import { Market } from "./components/Market";

export default function App() {
  const [view, setView] = useState<"landing" | "market">("landing");

  if (view === "landing") return <Landing onEnter={() => setView("market")} />;

  return <Market />;
}
