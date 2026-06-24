import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Trash2, Edit3, ArrowLeft, Play, Pause,
  RotateCcw, Sun, Moon, Clock, Save, FileText,
  Zap, ChevronUp, ChevronDown, X, Bold, Italic,
  Underline, AlignLeft, AlignCenter, AlignRight,
  Upload, Mic, Search,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
interface Script {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}
type View = "library" | "editor" | "teleprompter";

/* ─── Utilities ──────────────────────────────────────────── */
const estimateMinutes = (text: string) =>
  Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 130) || 0;

const formatDate = (d: Date) =>
  d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const wordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

/* ─── Glass surface tokens (all reference CSS vars) ─────── */
const S = {
  panelGlass: {
    backdropFilter: "blur(40px) saturate(200%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%)",
    backgroundColor: "var(--glass-panel-bg)",
    boxShadow: "0 0 0 1px var(--glass-panel-border), inset 0 1px 0 var(--glass-panel-inset), 0 24px 60px var(--glass-panel-shadow)",
  } as React.CSSProperties,

  floatCard: (hovered: boolean): React.CSSProperties => ({
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    backgroundColor: "var(--glass-float-bg)",
    boxShadow: hovered
      ? "0 0 0 1px var(--glass-float-border), inset 0 1px 0 var(--glass-panel-inset), 0 32px 64px var(--glass-panel-shadow)"
      : "0 0 0 1px var(--glass-float-border), inset 0 1px 0 var(--glass-panel-inset), 0 4px 20px var(--glass-panel-shadow)",
    transition: "box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  }),

  sidebar: {
    backdropFilter: "blur(60px) saturate(220%)",
    WebkitBackdropFilter: "blur(60px) saturate(220%)",
    backgroundColor: "var(--glass-sidebar-bg)",
    borderRight: "1px solid var(--border)",
  } as React.CSSProperties,

  toolbar: {
    backdropFilter: "blur(40px) saturate(200%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%)",
    backgroundColor: "var(--glass-toolbar-bg)",
    borderBottom: "1px solid var(--glass-toolbar-border)",
  } as React.CSSProperties,

  input: {
    backgroundColor: "var(--glass-input-bg)",
    border: "1px solid var(--glass-input-border)",
    borderRadius: "var(--radius)",
    boxShadow: "inset 0 1px 2px var(--glass-panel-shadow)",
  } as React.CSSProperties,

  iconBox: {
    background: "var(--glass-icon-bg)",
    border: "1px solid var(--glass-icon-border)",
    boxShadow: "inset 0 1px 0 var(--glass-panel-inset)",
  } as React.CSSProperties,

  primaryBtn: {
    background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, var(--accent-foreground)) 100%)",
    boxShadow: "0 1px 8px color-mix(in srgb, var(--primary) 40%, transparent), inset 0 1px 0 var(--glass-panel-inset)",
    borderRadius: "var(--radius)",
    color: "var(--primary-foreground)",
  } as React.CSSProperties,

  ghostBtn: {
    background: "var(--glass-input-bg)",
    border: "1px solid var(--glass-input-border)",
    boxShadow: "inset 0 1px 0 var(--glass-panel-inset)",
    borderRadius: "var(--radius)",
  } as React.CSSProperties,

  sidebarLinkActive: {
    background: "color-mix(in srgb, var(--sidebar-primary) 18%, transparent)",
    border: "1px solid color-mix(in srgb, var(--sidebar-primary) 28%, transparent)",
    boxShadow: "inset 0 1px 0 var(--glass-panel-inset)",
    color: "var(--sidebar-primary)",
    borderRadius: "calc(var(--radius) - 2px)",
  } as React.CSSProperties,

  tpControls: {
    backdropFilter: "blur(40px) saturate(160%)",
    WebkitBackdropFilter: "blur(40px) saturate(160%)",
    backgroundColor: "var(--tp-controls-bg)",
    borderTop: "1px solid var(--tp-controls-border)",
    boxShadow: "inset 0 1px 0 var(--tp-glass-inset)",
  } as React.CSSProperties,

  tpPlayBtn: {
    borderRadius: "50%",
    background: "var(--tp-foreground)",
    boxShadow: "0 0 0 1px var(--tp-controls-border), 0 4px 32px var(--tp-controls-bg), inset 0 1px 0 var(--tp-foreground)",
  } as React.CSSProperties,
};

/* ─── Sample data ────────────────────────────────────────── */
const SAMPLES: Script[] = [
  {
    id: "1",
    title: "Presentación de producto",
    content:
      "<p>Buenos días a todos. Hoy presentamos algo en lo que hemos trabajado durante dos años — un producto que cambiará fundamentalmente la manera en que te comunicas frente a una audiencia.</p><p>Antes de entrar en detalles, quiero tomarme un momento para agradecer al equipo. Cada persona en esta sala contribuyó a lo que están a punto de ver.</p><p>El reto que nos propusimos resolver es simple: hablar en público debería sentirse natural, no mecánico.</p>",
    updatedAt: new Date(2026, 5, 22, 14, 30),
  },
  {
    id: "2",
    title: "Reunión semanal del equipo",
    content:
      "<p>Hola a todos. Repasemos los puntos destacados de esta semana. Los números del segundo trimestre ya están disponibles y me complace informar que superamos nuestros objetivos en un doce por ciento.</p><p>Ingeniería entregó la nueva capa de autenticación a tiempo. Diseño completó los activos del rediseño. Ventas cerró tres contratos empresariales.</p>",
    updatedAt: new Date(2026, 5, 20, 9, 15),
  },
  {
    id: "3",
    title: "Pitch para inversores — Serie A",
    content:
      "<p>Estamos construyendo la infraestructura para la próxima generación de comunicación hablada. El mercado global es de cuarenta y siete mil millones de dólares, prácticamente intacto por la inteligencia artificial.</p><p>Nuestro enfoque es diferente. En lugar de reemplazar al ponente, lo potenciamos — dándole la confianza de transmitir su mensaje con claridad, en todo momento.</p>",
    updatedAt: new Date(2026, 5, 18, 11, 0),
  },
];

/* ─── App root ───────────────────────────────────────────── */
export default function App() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<View>("library");
  const [scripts, setScripts] = useState<Script[]>(SAMPLES);
  const [active, setActive] = useState<Script | null>(null);
  const [saved, setSaved] = useState(true);
  const [tpSpeed, setTpSpeed] = useState(2);
  const [tpSize, setTpSize] = useState(52);
  const [tpRunning, setTpRunning] = useState(false);
  const [tpMirror, setTpMirror] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastT = useRef(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const tick = useCallback((ts: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop += (tpSpeed * (ts - lastT.current)) / 60;
    lastT.current = ts;
    rafRef.current = requestAnimationFrame(tick);
  }, [tpSpeed]);

  useEffect(() => {
    if (tpRunning) {
      lastT.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) cancelAnimationFrame(rafRef.current);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tpRunning, tick]);

  const createScript = () => {
    const s: Script = { id: Date.now().toString(), title: "Guion sin título", content: "", updatedAt: new Date() };
    setScripts(p => [s, ...p]);
    setActive(s);
    setSaved(true);
    setView("editor");
  };

  const openScript = (s: Script) => { setActive({ ...s }); setSaved(true); setView("editor"); };
  const deleteScript = (id: string) => setScripts(p => p.filter(s => s.id !== id));

  const saveScript = (u: Script) => {
    const f = { ...u, updatedAt: new Date() };
    setScripts(p => p.some(s => s.id === f.id) ? p.map(s => s.id === f.id ? f : s) : [f, ...p]);
    setActive(f);
    setSaved(true);
  };

  const launch = () => {
    if (!active) return;
    saveScript(active);
    setTpRunning(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setView("teleprompter");
  };

  return (
    <div className="size-full bg-background text-foreground overflow-hidden" style={{ fontFamily: "var(--font-ui)" }}>
      {/* Ambient orbs — contained, decorative only */}
      {dark && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden style={{ zIndex: 0 }}>
          <div style={{
            position: "absolute", width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, var(--tp-ambient-orb-1) 0%, transparent 65%)",
            top: -180, left: -120,
          }} />
          <div style={{
            position: "absolute", width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, var(--tp-ambient-orb-2) 0%, transparent 70%)",
            bottom: 40, right: -80,
          }} />
        </div>
      )}

      <div className="relative size-full" style={{ zIndex: 1 }}>
        {view === "library" && (
          <LibraryView scripts={scripts} dark={dark} onToggleDark={() => setDark(d => !d)}
            onCreate={createScript} onOpen={openScript} onDelete={deleteScript} />
        )}
        {view === "editor" && active && (
          <EditorView script={active} saved={saved} dark={dark}
            onToggleDark={() => setDark(d => !d)} onBack={() => setView("library")}
            onTitleChange={t => { setActive(a => a ? { ...a, title: t } : a); setSaved(false); }}
            onContentChange={c => { setActive(a => a ? { ...a, content: c } : a); setSaved(false); }}
            onSave={() => active && saveScript(active)} onLaunch={launch} />
        )}
        {view === "teleprompter" && active && (
          <TeleprompterView script={active} speed={tpSpeed} fontSize={tpSize}
            running={tpRunning} mirror={tpMirror} scrollRef={scrollRef}
            onSpeedChange={setTpSpeed} onFontSizeChange={setTpSize}
            onToggleRun={() => setTpRunning(r => !r)}
            onReset={() => { setTpRunning(false); if (scrollRef.current) scrollRef.current.scrollTop = 0; }}
            onToggleMirror={() => setTpMirror(m => !m)} onExit={() => setView("editor")} />
        )}
      </div>
    </div>
  );
}

/* ─── Library view ───────────────────────────────────────── */
function LibraryView({ scripts, dark, onToggleDark, onCreate, onOpen, onDelete }:
  { scripts: Script[]; dark: boolean; onToggleDark: () => void; onCreate: () => void; onOpen: (s: Script) => void; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const filtered = scripts.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    stripHtml(s.content).toLowerCase().includes(query.toLowerCase())
  );
  const total = scripts.length;

  return (
    <div className="flex h-full view-in">
      <Sidebar dark={dark} onToggleDark={onToggleDark} activeView="library" onCreate={onCreate} onGoLibrary={() => {}} />
      <main className="flex-1 overflow-y-auto editor-scroll min-w-0">
        {/* Header — editorial layout */}
        <div className="sticky top-0 z-10 px-8 pt-6 pb-4" style={S.toolbar}>
          <div className="flex items-end justify-between mb-5">
            <div>
              {/* Large editorial counter */}
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
            <PrimaryButton onClick={onCreate} icon={<Plus size={13} strokeWidth={2.5} />} label="Nuevo guion" />
          </div>

          {/* Spotlight search */}
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

        <div className="p-8">
          {filtered.length === 0 && query ? (
            <div className="flex flex-col items-center py-20">
              <p className="text-sm text-muted-foreground">Sin resultados para &ldquo;{query}&rdquo;</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onCreate={onCreate} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s, i) => (
                <ScriptCard key={s.id} script={s} index={i} onOpen={onOpen} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Script card with 3D tilt ───────────────────────────── */
function ScriptCard({ script, index, onOpen, onDelete }:
  { script: Script; index: number; onOpen: (s: Script) => void; onDelete: (id: string) => void }) {
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
          ? "transform 0.08s linear, box-shadow 0.3s cubic-bezier(0.16,1,0.3,1)"
          : "transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1)",
        animationDelay: `${index * 55}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={clearTilt}
      onMouseMove={handleMouseMove}
      onClick={() => onOpen(script)}
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
            {script.title}
          </h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 min-h-[3.5rem] mb-4">
          {preview || "Sin contenido aún."}
        </p>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--glass-float-border)" }}>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="flex items-center gap-1"><Clock size={10} />{mins} min</span>
            <span>{formatDate(script.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.18s cubic-bezier(0.16,1,0.3,1)" }}>
            <button
              onClick={e => { e.stopPropagation(); onOpen(script); }}
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

/* ─── Editor view ────────────────────────────────────────── */
function EditorView({ script, saved, dark, onToggleDark, onBack, onTitleChange, onContentChange, onSave, onLaunch }:
  { script: Script; saved: boolean; dark: boolean; onToggleDark: () => void; onBack: () => void;
    onTitleChange: (t: string) => void; onContentChange: (c: string) => void; onSave: () => void; onLaunch: () => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [displayWords, setDisplayWords] = useState(wordCount(stripHtml(script.content)));
  const [wordKey, setWordKey] = useState(0);
  const mins = estimateMinutes(stripHtml(script.content));

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = script.content;
  }, []);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onContentChange(html);
    const wc = wordCount(stripHtml(html));
    if (wc !== displayWords) {
      setDisplayWords(wc);
      setWordKey(k => k + 1);
    }
  };

  const exec = (cmd: string) => {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
    if (editorRef.current) onContentChange(editorRef.current.innerHTML);
  };

  return (
    <div className="flex h-full view-in">
      <Sidebar dark={dark} onToggleDark={onToggleDark} activeView="editor" onCreate={() => {}} onGoLibrary={onBack} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toolbar */}
        <header className="flex items-center justify-between px-5 py-2.5" style={S.toolbar}>
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={13} strokeWidth={2.5} />Biblioteca
          </button>

          <div className="flex items-center gap-5 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              <Clock size={11} />{mins} min
            </span>
            {/* Save indicator — static, no animation */}
            <span style={{ color: saved ? "var(--muted-foreground)" : "var(--status-warning)", transition: "color 0.3s ease" }}>
              {saved ? "Guardado" : "Sin guardar"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <GhostButton onClick={onSave} icon={<Save size={12} />} label="Guardar" />
            <GhostButton onClick={() => {}} icon={<Upload size={12} />} label="Importar" />
            <GhostButton onClick={() => {}} icon={<Zap size={12} />} label="IA" />
            <PrimaryButton onClick={onLaunch} icon={<Play size={11} fill="currentColor" />} label="Iniciar" />
          </div>
        </header>

        {/* Document area */}
        <div className="flex-1 overflow-y-auto editor-scroll px-6 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Document glass panel */}
            <div className="relative glass-noise" style={{ borderRadius: "calc(var(--radius) + 6px)", overflow: "hidden", ...S.panelGlass }}>
              {/* macOS titlebar */}
              <div className="flex items-center gap-2 px-4 py-3" style={{
                borderBottom: "1px solid var(--glass-toolbar-border)",
                background: "color-mix(in srgb, var(--glass-panel-inset) 20%, transparent)",
              }}>
                <div className="flex items-center gap-1.5 mr-2">
                  {(["--traffic-red", "--traffic-yellow", "--traffic-green"] as const).map(v => (
                    <div key={v} style={{ width: 12, height: 12, borderRadius: "50%", background: `var(${v})`, opacity: 0.85 }} />
                  ))}
                </div>
                <div className="flex items-center gap-0.5 ml-1">
                  {[
                    { icon: <Bold size={11} />, cmd: "bold", title: "Negrita" },
                    { icon: <Italic size={11} />, cmd: "italic", title: "Cursiva" },
                    { icon: <Underline size={11} />, cmd: "underline", title: "Subrayado" },
                  ].map(({ icon, cmd, title }) => (
                    <ToolbarBtn key={cmd} onClick={() => exec(cmd)} title={title}>{icon}</ToolbarBtn>
                  ))}
                  <div className="w-px h-3.5 mx-1" style={{ background: "var(--glass-divider)" }} />
                  {[
                    { icon: <AlignLeft size={11} />, cmd: "justifyLeft", title: "Izquierda" },
                    { icon: <AlignCenter size={11} />, cmd: "justifyCenter", title: "Centro" },
                    { icon: <AlignRight size={11} />, cmd: "justifyRight", title: "Derecha" },
                  ].map(({ icon, cmd, title }) => (
                    <ToolbarBtn key={cmd} onClick={() => exec(cmd)} title={title}>{icon}</ToolbarBtn>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="px-9 pt-8 pb-2">
                <input
                  value={script.title}
                  onChange={e => onTitleChange(e.target.value)}
                  className="w-full bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
                  style={{ letterSpacing: "-0.025em", fontFamily: "var(--font-ui)" }}
                  placeholder="Título del guion..."
                />
              </div>

              {/* Editor */}
              <div className="px-9 pb-10">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleInput}
                  className="min-h-[300px] outline-none text-foreground"
                  style={{ fontFamily: "var(--font-reading)", fontSize: "16px", lineHeight: "1.9" }}
                  data-placeholder="Escribe tu guion aquí..."
                />
              </div>
            </div>

            {/* Footer stats */}
            <div className="flex items-center justify-between mt-4 px-1">
              <span
                key={wordKey}
                className="text-[11px] text-muted-foreground word-tick"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {displayWords.toLocaleString("es-ES")} palabras
              </span>
              <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                Editado {formatDate(script.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Teleprompter view ──────────────────────────────────── */
function TeleprompterView({ script, speed, fontSize, running, mirror, scrollRef,
  onSpeedChange, onFontSizeChange, onToggleRun, onReset, onToggleMirror, onExit }:
  { script: Script; speed: number; fontSize: number; running: boolean; mirror: boolean;
    scrollRef: React.RefObject<HTMLDivElement>; onSpeedChange: (v: number) => void;
    onFontSizeChange: (v: number) => void; onToggleRun: () => void; onReset: () => void;
    onToggleMirror: () => void; onExit: () => void }) {
  const plain = stripHtml(script.content);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorVisible, setCursorVisible] = useState(false);
  // Ref prevents interval leak if component unmounts mid-countdown
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const cancelCountdown = () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
  };

  /* Custom dot cursor */
  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    setCursorVisible(true);
  };

  /* 3-2-1 countdown before scroll starts */
  const handlePlayPress = () => {
    if (running) { onToggleRun(); return; }
    cancelCountdown();
    setCountdown(3);
    let n = 3;
    countdownRef.current = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        onToggleRun();
      } else {
        setCountdown(n);
      }
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col tp-cursor"
      style={{ zIndex: 50, background: "var(--tp-background)", contain: "strict" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCursorVisible(false)}
    >
      {/* Custom cursor dot */}
      {cursorVisible && (
        <div
          className="tp-cursor-dot"
          style={{ left: cursorPos.x, top: cursorPos.y, opacity: cursorVisible ? 1 : 0 }}
          aria-hidden
        />
      )}

      {/* 3-2-1 Countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 60, background: "var(--tp-overlay-bg)", backdropFilter: "blur(12px)" }}>
          <span
            key={countdown}
            className="countdown-num font-semibold"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "clamp(6rem, 20vw, 12rem)",
              color: "var(--tp-foreground)",
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            {countdown}
          </span>
        </div>
      )}

      {/* Text area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden select-none tp-scroll tp-ready"
        style={{ padding: "22vh 10vw 0", transform: mirror ? "scaleX(-1)" : undefined }}
      >
        <p
          className="pb-[60vh]"
          style={{
            color: "var(--tp-foreground)",
            fontFamily: "var(--font-reading)",
            fontSize: `${fontSize}px`,
            lineHeight: "1.65",
            fontWeight: 300,
            letterSpacing: "0.005em",
          }}
        >
          {plain || "Sin contenido. Vuelve atrás y escribe tu guion."}
        </p>
      </div>

      {/* Fade gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: "20vh", background: "var(--tp-fade-top)" }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-[80px]" style={{ height: "22vh", background: "var(--tp-fade-bottom)" }} aria-hidden />

      {/* Reading line */}
      <div className="pointer-events-none absolute inset-x-0" style={{ top: "37%", height: 1, background: "var(--tp-focus-line)" }} aria-hidden />

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-between px-7 py-4" style={S.tpControls}>
        {/* Left */}
        <div className="flex items-center gap-2 w-44">
          <TpButton onClick={() => { cancelCountdown(); onExit(); }}><X size={12} />Salir</TpButton>
          <button
            onClick={onReset}
            className="w-8 h-8 flex items-center justify-center transition-colors"
            style={{ borderRadius: "var(--radius)", border: "1px solid var(--tp-btn-border)", color: "var(--tp-btn-color)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--tp-foreground)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--tp-btn-color)")}
            title="Reiniciar"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Center */}
        <div className="flex items-center gap-8">
          <KnobControl label="Velocidad" value={speed.toFixed(1)}
            onDec={() => onSpeedChange(Math.max(0.5, speed - 0.5))}
            onInc={() => onSpeedChange(Math.min(10, speed + 0.5))} />

          {/* Speed arc + play button */}
          <div className="relative flex items-center justify-center">
            <SpeedArc speed={speed} running={running} />
            <button
              onClick={handlePlayPress}
              className="w-14 h-14 flex items-center justify-center transition-all active:scale-90"
              style={{ ...S.tpPlayBtn, position: "relative", zIndex: 1 }}
            >
              {running
                ? <Pause size={20} style={{ fill: "var(--tp-play-icon)" }} strokeWidth={0} />
                : <Play size={20} style={{ fill: "var(--tp-play-icon)", marginLeft: 2 }} strokeWidth={0} />}
            </button>
          </div>

          <KnobControl label="Tamaño" value={`${fontSize}`}
            onDec={() => onFontSizeChange(Math.max(24, fontSize - 4))}
            onInc={() => onFontSizeChange(Math.min(96, fontSize + 4))} />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 w-44 justify-end">
          <button
            onClick={onToggleMirror}
            className="px-3 py-1.5 text-[11px] font-medium transition-all"
            style={{
              borderRadius: "var(--radius)",
              border: `1px solid ${mirror ? "var(--tp-mirror-border)" : "var(--tp-btn-border)"}`,
              color: mirror ? "var(--tp-mirror-text)" : "var(--tp-btn-color)",
              background: mirror ? "var(--tp-mirror-accent)" : "transparent",
            }}
          >Espejo</button>
          <p className="text-[10px] max-w-[80px] truncate" style={{ color: "var(--tp-label-color)", fontFamily: "var(--font-mono)" }}>
            {script.title}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Speed arc SVG ──────────────────────────────────────── */
function SpeedArc({ speed, running }: { speed: number; running: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = (speed - 0.5) / 9.5; // 0.5–10 range → 0–1
  const dash = circ * 0.75 * pct;  // 270° arc
  const gap = circ - dash;
  const rotation = -225; // start at bottom-left

  return (
    <svg
      width={80} height={80}
      viewBox="0 0 80 80"
      className={running ? "arc-active" : ""}
      style={{ position: "absolute", inset: 0, margin: "auto" }}
      aria-hidden
    >
      {/* Track */}
      <circle cx={40} cy={40} r={r} fill="none"
        stroke="var(--tp-btn-border)"
        strokeWidth={1.5}
        strokeDasharray={`${circ * 0.75} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} 40 40)`}
      />
      {/* Progress */}
      <circle cx={40} cy={40} r={r} fill="none"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeDasharray={`${dash} ${gap + circ * 0.25}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} 40 40)`}
        style={{ transition: "stroke-dasharray 0.3s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

function KnobControl({ label, value, onDec, onInc }:
  { label: string; value: string; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "var(--tp-label-color)", fontFamily: "var(--font-ui)" }}>{label}</p>
      <div className="flex items-center gap-1">
        <KnobBtn onClick={onDec}><ChevronDown size={12} /></KnobBtn>
        <span className="text-sm w-9 text-center tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--tp-value-color)" }}>{value}</span>
        <KnobBtn onClick={onInc}><ChevronUp size={12} /></KnobBtn>
      </div>
    </div>
  );
}

function KnobBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-6 h-6 flex items-center justify-center transition-colors"
      style={{ borderRadius: "calc(var(--radius) - 10px)", color: "var(--tp-btn-color)" }}
      onMouseEnter={e => (e.currentTarget.style.color = "var(--tp-foreground)")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--tp-btn-color)")}
    >{children}</button>
  );
}

function TpButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all"
      style={{ borderRadius: "var(--radius)", border: "1px solid var(--tp-btn-border)", color: "var(--tp-btn-color)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--tp-foreground)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--tp-btn-color)"; }}
    >{children}</button>
  );
}

/* ─── Sidebar ────────────────────────────────────────────── */
function Sidebar({ dark, onToggleDark, activeView, onCreate, onGoLibrary }:
  { dark: boolean; onToggleDark: () => void; activeView: "library" | "editor"; onCreate: () => void; onGoLibrary: () => void }) {
  return (
    <aside className="w-[196px] flex-shrink-0 h-full flex flex-col" style={S.sidebar}>
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="brand-icon"
            style={{
              width: 30, height: 30, borderRadius: "calc(var(--radius) - 2px)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent-foreground)) 100%)",
            }}
          >
            <Mic size={14} style={{ color: "var(--primary-foreground)" }} />
          </div>
          <span className="text-sm font-semibold text-foreground" style={{ letterSpacing: "-0.02em", fontFamily: "var(--font-ui)" }}>
            Prompter
          </span>
        </div>
      </div>

      <SidebarSection label="Navegación">
        <SidebarLink label="Mis guiones" active={activeView === "library"} onClick={activeView === "editor" ? onGoLibrary : undefined} />
        <SidebarLink label="Nuevo guion" active={false} onClick={onCreate} />
      </SidebarSection>

      <SidebarSection label="Apariencia">
        <button onClick={onToggleDark}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
          style={{ borderRadius: "calc(var(--radius) - 2px)", fontFamily: "var(--font-ui)" }}
        >
          {dark ? <Sun size={13} className="text-muted-foreground" /> : <Moon size={13} className="text-muted-foreground" />}
          {dark ? "Modo claro" : "Modo oscuro"}
        </button>
      </SidebarSection>

      <div className="mt-auto px-4 pb-5">
        <p className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors" style={{ fontFamily: "var(--font-ui)" }}>
          Términos de uso
        </p>
      </div>
    </aside>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 mb-1 mt-3">
      <p className="px-2 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1" style={{ fontFamily: "var(--font-ui)" }}>{label}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({ label, active, onClick }:
  { label: string; active: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-xs font-medium transition-all"
      style={active ? { ...S.sidebarLinkActive, fontFamily: "var(--font-ui)" } : {
        color: "var(--sidebar-foreground)",
        borderRadius: "calc(var(--radius) - 2px)",
        border: "1px solid transparent",
        fontFamily: "var(--font-ui)",
      }}
    >{label}</button>
  );
}

/* ─── Shared primitives ──────────────────────────────────── */
function PrimaryButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className="btn-primary-wrap flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
      style={{ ...S.primaryBtn, fontFamily: "var(--font-ui)" }}
    >{icon}{label}</button>
  );
}

function GhostButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all"
      style={{ ...S.ghostBtn, fontFamily: "var(--font-ui)" }}
    >{icon}{label}</button>
  );
}

function ToolbarBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      style={{ borderRadius: "calc(var(--radius) - 4px)" }}
    >{children}</button>
  );
}
