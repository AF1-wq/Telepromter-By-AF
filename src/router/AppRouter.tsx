import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardView } from '../views/DashboardView/DashboardView';
import { EditorView } from '../views/EditorView/EditorView';
import { PlayerView } from '../views/PlayerView/PlayerView';
import { useTheme } from '../hooks/useTheme';

export const AppRouter: React.FC = () => {
  useTheme(); // Initialize theme

  return (
    <BrowserRouter basename="/Telepromter-By-AF/">
      <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden" style={{ fontFamily: "var(--font-ui)" }}>
        <div className="flex-1 flex h-full min-w-0 relative" style={{ zIndex: 1 }}>
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
