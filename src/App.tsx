import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import BrowsePage from "./pages/BrowsePage";
import ExercisePage from "./pages/ExercisePage";
import RoutinesPage from "./pages/RoutinesPage";
import RoutineEditPage from "./pages/RoutineEditPage";
import RunPage from "./pages/RunPage";
import { useData } from "./lib/data";

function TabBar() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium ${
      isActive ? "text-indigo-400" : "text-slate-400"
    }`;
  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <NavLink to="/" className={tab} end>
        <SearchIcon />
        Browse
      </NavLink>
      <NavLink to="/routines" className={tab}>
        <ListIcon />
        Routines
      </NavLink>
    </nav>
  );
}

export default function App() {
  const { status } = useData();

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col">
      <main className="flex-1 px-4 pb-6 pt-4">
        {status === "error" ? (
          <div className="card p-6 text-sm text-rose-300">
            Couldn't load the exercise data. Check your connection and reload.
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<BrowsePage />} />
            <Route path="/exercise/:id" element={<ExercisePage />} />
            <Route path="/routines" element={<RoutinesPage />} />
            <Route path="/routine/:id" element={<RoutineEditPage />} />
            <Route path="/routine/:id/run" element={<RunPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <TabBar />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
