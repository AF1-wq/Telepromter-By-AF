import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardView } from '../views/DashboardView/DashboardView';
import { EditorView } from '../views/EditorView/EditorView';
import { PlayerView } from '../views/PlayerView/PlayerView';
import { useTheme } from '../hooks/useTheme';
import { NavigationMenu } from '../components/NavigationMenu';

export const AppRouter: React.FC = () => {
  useTheme(); // Initialize theme

  return (
    <BrowserRouter basename="/Telepromter-By-AF/">
      <div className="bg-mesh"></div>
      <div className="bg-orb"></div>
      <div className="bg-orb2"></div>
      <div className="app-frame">
        <div className="app-body">
          <NavigationMenu />
          <main className="main-content glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '0', borderRadius: '16px' }}>
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/editor/:id" element={<EditorView />} />
              <Route path="/player/:id" element={<PlayerView />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};
