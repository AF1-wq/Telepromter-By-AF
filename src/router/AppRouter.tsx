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
      <NavigationMenu />
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/editor/:id" element={<EditorView />} />
        <Route path="/player/:id" element={<PlayerView />} />
      </Routes>
    </BrowserRouter>
  );
};
