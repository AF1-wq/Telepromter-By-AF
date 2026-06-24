import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScripts } from '../../hooks/useScripts';
import { useTheme } from '../../hooks/useTheme';
import { Plus, Search, FileText, Clock, Edit3, Trash2, Mic } from 'lucide-react';
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const preview = stripHtml(script.content);
  const mins = estimateMinutes(preview);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -5, y: dx * 5 }); // subtle 5deg max
  };

  const clearTilt = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden cursor-pointer card-enter glass-noise"
      style={{
        borderRadius: "calc(var(--radius) + 4px)",
        ...S.floatCard(hovered),
        transform: hovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px) scale(1.02)`
          : "perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)",
        transition: hovered
          ? "transform 0.08s linear, box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        animationDelay: `${index * 55}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={clearTilt}
      onMouseMove={handleMouseMove}
      onClick={() => onOpen(script.id)}
    >
      {/* Accent stripe */}
      <div style={{
        height: 2,
        background: "linear-gradient(90deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 30%, transparent) 100%)",
      }} />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3.5">
          <div style={{
            width: 34, height: 34, borderRadius: "calc(var(--radius) - 2px)",
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            ...S.iconBox,
          }}>
            <FileText size={14} style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug pt-1" style={{ letterSpacing: "-0.01em" }}>
            {script.title || 'Sin Título'}
          </h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 min-h-[3.5rem] mb-4">
          {preview || "Sin contenido aún."}
        </p>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--glass-float-border)" }}>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="flex items-center gap-1"><Clock size={10} />{mins} min</span>
            <span>{formatDate(script.lastEdited)}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <button
              onClick={e => { e.stopPropagation(); onOpen(script.id); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium"
              style={{ borderRadius: "calc(var(--radius) - 4px)", background: "var(--glass-icon-bg)", color: "var(--accent-foreground)", border: "1px solid var(--glass-icon-border)" }}
            >
              <Edit3 size={10} />Editar
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(script.id); }}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              style={{ borderRadius: "calc(var(--radius) - 4px)" }}
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
        width: 64, height: 64, borderRadius: "calc(var(--radius) + 6px)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        ...S.iconBox,
        boxShadow: "inset 0 1px 0 var(--glass-panel-inset), 0 8px 32px color-mix(in srgb, var(--primary) 20%, transparent)",
      }}>
        <Mic size={26} style={{ color: "var(--primary)" }} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2" style={{ letterSpacing: "-0.02em" }}>
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

  const handleCreate = () => navigate('/editor/new');
  const handleOpen = (id: string) => navigate(`/editor/${id}`);

  return (
    <div className="flex h-full w-full view-in relative z-10">
      <Sidebar dark={dark} onToggleDark={toggleTheme} activeView="library" onCreate={handleCreate} onGoLibrary={() => {}} />
      <main className="flex-1 h-full flex flex-col min-w-0 relative">
        <div className="sticky top-0 z-30 px-8 pt-6 pb-4" style={S.toolbar}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className="font-semibold leading-none"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 5rem)",
                    letterSpacing: "-0.05em",
                    fontVariantNumeric: "tabular-nums",
                    color: "color-mix(in srgb, var(--foreground) 12%, transparent)",
                    lineHeight: 1,
                  }}
                >
                  {String(total).padStart(2, "0")}
                </span>
                <h1 className="text-[22px] font-semibold text-foreground pb-1" style={{ letterSpacing: "-0.03em" }}>
                  Guiones
                </h1>
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                {scripts.reduce((acc, s) => acc + wordCount(stripHtml(s.content)), 0).toLocaleString("es-ES")} palabras en total
              </p>
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
