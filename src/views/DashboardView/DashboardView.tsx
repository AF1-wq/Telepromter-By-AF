import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScripts } from '../../hooks/useScripts';
import { useTheme } from '../../hooks/useTheme';
import { Plus, Search, FileText, Clock, Edit3, Trash2 } from 'lucide-react';
import { S, Sidebar, PrimaryButton } from '../../components/ui/SharedComponents';

const estimateMinutes = (text: string) =>
  Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 130) || 0;

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const wordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

function ScriptCard({ script, index, onOpen, onDelete }: any) {
  const [hovered, setHovered] = useState(false);
  const preview = stripHtml(script.content);
  const mins = estimateMinutes(preview);

  return (
    <div
      className="relative overflow-hidden cursor-pointer card-enter"
      style={{
        borderRadius: "12px",
        backgroundColor: "var(--card)",
        border: `1px solid ${hovered ? "var(--border)" : "var(--border)"}`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        animationDelay: `${index * 55}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(script.id)}
    >
      {/* Top accent line */}
      <div style={{ height: 1, background: "var(--border)" }} />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div style={{
            width: 32, height: 32, borderRadius: "8px",
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--muted)",
          }}>
            <FileText size={14} style={{ color: "var(--muted-foreground)" }} />
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug pt-1" style={{ letterSpacing: "-0.01em" }}>
            {script.title || 'Sin Título'}
          </h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 min-h-[3rem] mb-4">
          {preview || "Sin contenido aún."}
        </p>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="flex items-center gap-1"><Clock size={10} />{mins} min</span>
            <span>{formatDate(script.lastEdited)}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease" }}>
            <button
              onClick={e => { e.stopPropagation(); onOpen(script.id); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              style={{ borderRadius: "6px", background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              <Edit3 size={10} />Editar
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(script.id); }}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              style={{ borderRadius: "6px" }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div style={{
        width: 48, height: 48, borderRadius: "12px", marginBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--muted)",
      }}>
        <FileText size={22} style={{ color: "var(--muted-foreground)" }} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2" style={{ letterSpacing: "-0.02em" }}>
        Sin guiones todavía
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
        Crea tu primer guion y empieza a hablar con confianza frente a cualquier audiencia.
      </p>
      <PrimaryButton onClick={onCreate} icon={<Plus size={13} strokeWidth={2.5} />} label="Crear primer guion" />
    </div>
  );
}

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { scripts, deleteScript } = useScripts();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const [query, setQuery] = useState("");

  const filtered = scripts.filter(s =>
    (s.title || "").toLowerCase().includes(query.toLowerCase()) ||
    stripHtml(s.content).toLowerCase().includes(query.toLowerCase())
  );
  const total = scripts.length;
  const totalWords = scripts.reduce((acc, s) => acc + wordCount(stripHtml(s.content)), 0);

  const handleCreate = () => navigate('/editor/new');
  const handleOpen = (id: string) => navigate(`/editor/${id}`);

  return (
    <div className="flex h-full w-full view-in">
      <Sidebar dark={dark} onToggleDark={toggleTheme} activeView="library" onCreate={handleCreate} onGoLibrary={() => {}} />
      <main className="flex-1 h-full flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-30 px-8 pt-6 pb-4" style={S.toolbar}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                {total > 0 && (
                  <span
                    className="font-semibold leading-none select-none"
                    style={{
                      fontSize: "clamp(2.5rem, 6vw, 4rem)",
                      letterSpacing: "-0.05em",
                      fontVariantNumeric: "tabular-nums",
                      color: "color-mix(in srgb, var(--foreground) 10%, transparent)",
                      lineHeight: 1,
                    }}
                  >
                    {String(total).padStart(2, "0")}
                  </span>
                )}
                <h1 className="text-[22px] font-semibold text-foreground pb-1" style={{ letterSpacing: "-0.03em" }}>
                  Guiones
                </h1>
              </div>
              {total > 0 && (
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                  {totalWords.toLocaleString("es-ES")} palabras en total
                </p>
              )}
            </div>
            <PrimaryButton onClick={handleCreate} icon={<Plus size={13} strokeWidth={2.5} />} label="Nuevo guion" />
          </div>

          <div className="relative">
            <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar guiones..."
              className="w-full pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all"
              style={{ ...S.input, fontFamily: "var(--font-ui)" }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto editor-scroll">
          {filtered.length === 0 && query ? (
            <div className="flex flex-col items-center py-20">
              <p className="text-sm text-muted-foreground">Sin resultados para &ldquo;{query}&rdquo;</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s, i) => (
                <ScriptCard key={s.id} script={s} index={i} onOpen={handleOpen} onDelete={deleteScript} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
