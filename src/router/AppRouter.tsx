import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardView } from '../views/DashboardView/DashboardView';
import { EditorView } from '../views/EditorView/EditorView';
import { PlayerView } from '../views/PlayerView/PlayerView';
import { useTheme } from '../hooks/useTheme';
import { NavigationMenu } from '../components/NavigationMenu';
import { Titlebar } from '../components/Titlebar';

export const AppRouter: React.FC = () => {
  useTheme(); // Initialize theme

  return (
    <BrowserRouter basename="/Telepromter-By-AF/">
      <Titlebar />
      <NavigationMenu />
      <div style={{
        position: 'absolute',
        top: '44px',
        left: '200px',
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/editor/:id" element={<EditorView />} />
          <Route path="/player/:id" element={<PlayerView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
