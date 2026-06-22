import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useReadingMode } from '../hooks/useReadingMode';
import { useBionicMode } from '../hooks/useBionicMode';
import { LegalModal } from './LegalModal';
import './NavigationMenu.css';

export const NavigationMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useReadingMode();
  const { bionicMode, setBionicMode } = useBionicMode();
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  // If in player, we might hide the sidebar, but user asked for persistent sidebar.
  // We'll keep it persistent.

  return (
    <>
      <div className="nav-sidebar">
        <div className="nav-sidebar-content">
          <div className="nav-section">
            <h3>Navegación</h3>
            <button className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
              Mis Guiones
            </button>
            <button className={`nav-btn ${location.pathname === '/editor/new' ? 'active' : ''}`} onClick={() => navigate('/editor/new')}>
              Crear Nuevo
            </button>
          </div>

          <div className="nav-section">
            <h3>Apariencia</h3>
            <button className="nav-btn theme-btn" onClick={toggleTheme}>
              {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
            </button>
          </div>

          {location.pathname.startsWith('/player') && (
            <div className="nav-section">
              <h3>Modo de Lectura</h3>
              <select className="nav-select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                <option value="standard">Estándar</option>
                <option value="pro">Alto Contraste</option>
                <option value="focus">Enfoque (Línea)</option>
                <option value="accessibility">Accesibilidad</option>
              </select>
            </div>
          )}

          {location.pathname.startsWith('/player') && (
            <div className="nav-section">
              <h3>Asistente</h3>
              <button className={`nav-btn ${bionicMode ? 'active' : ''}`} onClick={() => setBionicMode(!bionicMode)}>
                Biónica {bionicMode ? '(On)' : '(Off)'}
              </button>
            </div>
          )}

          <div className="nav-section" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button className="nav-btn" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', opacity: 0.8 }} onClick={() => setIsLegalModalOpen(true)}>
              Términos
            </button>
          </div>
        </div>
      </div>

      <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
    </>
  );
};

