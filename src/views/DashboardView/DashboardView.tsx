import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScripts } from '../../hooks/useScripts';
import './DashboardView.css';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { scripts, deleteScript } = useScripts();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getExcerpt = (text: string) => {
    if (!text) return 'Sin contenido...';
    const words = text.trim().split(/\s+/);
    if (words.length <= 10) return text;
    return words.slice(0, 10).join(' ') + '...';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteScript(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId(current => current === id ? null : current);
      }, 3000);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Mis Guiones</h1>
      </header>
      
      <main className="dashboard-content">
        {scripts.length === 0 ? (
          <div className="empty-state">
            <p>Aún no tienes guiones. Crea uno nuevo para comenzar.</p>
          </div>
        ) : (
          <div className="scripts-grid">
            {scripts.map(script => (
              <div key={script.id} className="script-card" onClick={() => navigate(`/editor/${script.id}`)}>
                <div className="script-card-content">
                  <h3>{script.title || 'Sin Título'}</h3>
                  <p className="script-excerpt">{getExcerpt(script.content)}</p>
                </div>
                <div className="script-card-footer">
                  <span className="script-date">Editado: {formatDate(script.lastEdited)}</span>
                  <div className="script-actions">
                    <button 
                      className={`action-btn delete-btn ${confirmDeleteId === script.id ? 'confirm' : ''}`}
                      onClick={(e) => handleDelete(script.id, e)}
                    >
                      {confirmDeleteId === script.id ? '¿Seguro?' : 'Eliminar'}
                    </button>
                    <button 
                      className="action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/editor/${script.id}`);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <button 
        className="fab-button bg-gradient-accent" 
        onClick={() => navigate('/editor/new')}
        title="Crear nuevo guión"
      >
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
};
