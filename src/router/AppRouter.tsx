import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardView } from '../views/DashboardView/DashboardView';
import { EditorView } from '../views/EditorView/EditorView';
import { PlayerView } from '../views/PlayerView/PlayerView';
import { useTheme } from '../hooks/useTheme';

export const AppRouter: React.FC = () => {
  useTheme(); // Initialize theme

  return (
    <BrowserRouter basename="/Telepromter-By-AF/">
      <div className="size-full bg-background text-foreground overflow-hidden" style={{ fontFamily: "var(--font-ui)", width: "100vw", height: "100vh" }}>
        <div className="relative size-full h-full" style={{ zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/editor/:id" element={<EditorView />} />
            <Route path="/player/:id" element={<PlayerView />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};
