import React, { useState } from "react";
import { Zap, Sun, Moon, X } from "lucide-react";

export const S = {
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

export function Sidebar({ dark, onToggleDark, activeView, onCreate, onGoLibrary }:
  { dark: boolean; onToggleDark: () => void; activeView: "library" | "editor"; onCreate: () => void; onGoLibrary: () => void }) {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <aside className="w-64 flex-shrink-0 h-full flex flex-col relative z-40" style={S.sidebar}>
        {/* macOS window controls */}
        <div className="flex items-center gap-1.5 px-4 pt-4">
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FEBC2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28C840" }} />
        </div>

        <div className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="brand-icon"
            style={{
              width: 30, height: 30, borderRadius: "calc(var(--radius) - 2px)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent-foreground)) 100%)",
            }}
          >
            <Zap size={14} style={{ color: "var(--primary-foreground)" }} fill="currentColor" />
          </div>
          <span className="text-sm font-semibold text-foreground" style={{ letterSpacing: "-0.02em", fontFamily: "var(--font-ui)" }}>
            Teleprompter by AF
          </span>
        </div>
      </div>

      <SidebarSection label="Navegación">
        <SidebarLink label="Mis guiones" active={activeView === "library"} onClick={onGoLibrary} />
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
        <button onClick={() => setShowTerms(true)} className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-left" style={{ fontFamily: "var(--font-ui)" }}>
          Términos y Privacidad
        </button>
      </div>
    </aside>

    {showTerms && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={() => setShowTerms(false)}>
        <div className="bg-card text-card-foreground w-full max-w-2xl rounded-xl shadow-lg border border-border flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-ui)" }}>Términos y Privacidad</h2>
            <button onClick={() => setShowTerms(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="p-6 overflow-y-auto text-sm leading-relaxed" style={{ fontFamily: "var(--font-ui)" }}>
              <p className="mb-4"><strong>1. Transparencia y Privacidad por Diseño</strong><br/>En Teleprompter by AF, tu privacidad es nuestra prioridad absoluta. Nuestra aplicación ha sido construida bajo el principio de 'Privacidad por Diseño'. Esto significa que no almacenamos, no guardamos y no tenemos bases de datos con los guiones o textos que escribes en nuestra plataforma.</p>
              <p className="mb-4"><strong>2. ¿Cómo funciona nuestra Inteligencia Artificial?</strong><br/>Cuando utilizas las herramientas de asistencia de IA (como 'Mejorar Cadencia', 'Coach de Pronunciación' o 'Traducir'), tu texto no se procesa localmente. El texto seleccionado se envía de forma encriptada a nuestro servidor privado. Nuestro servidor se comunica exclusivamente con nuestro proveedor de Inteligencia Artificial (Groq) para procesar tu solicitud. Una vez que la IA devuelve la respuesta, tu texto original y la respuesta son eliminados inmediatamente de la memoria de nuestro servidor.</p>
              <p className="mb-4"><strong>3. Uso de tus datos</strong><br/>- Sin retención de datos: Ningún guion o documento que insertes en el teleprompter se guarda en nuestros servidores al finalizar la sesión.<br/>- Sin entrenamiento de IA: Garantizamos que los textos que envías no son utilizados para entrenar modelos de lenguaje públicos o privados.</p>
              <p className="mb-4"><strong>4. Proveedores de Infraestructura</strong><br/>Nos apoyamos en infraestructuras líderes: Render (para nuestro servidor de conexión seguro) y Groq (motor de procesamiento de IA). Ambas plataformas operan bajo estrictos estándares de seguridad y encriptación.</p>
              <p className="mb-4"><strong>5. Propiedad Intelectual y Derechos de Autor (Copyright)</strong><br/>El usuario es el único responsable del contenido (textos, guiones, documentos o archivos PDF) que introduzca, importe o procese en la aplicación. Teleprompter by AF y su desarrollador no asumen ninguna responsabilidad por infracciones de derechos de autor, plagio o uso indebido de material protegido por propiedad intelectual realizado por los usuarios. Al importar un documento, el usuario declara tener los derechos necesarios sobre el mismo.</p>
              <p className="mb-4"><strong>6. Limitación de Responsabilidad (Exención Legal)</strong><br/>Esta herramienta se proporciona "tal cual" (as is) y "según disponibilidad". El desarrollador se exime de toda responsabilidad civil, penal o comercial derivada del uso, mal uso o incapacidad de uso de la aplicación. Esto incluye, pero no se limita a, la pérdida de información, interrupciones del servicio, o cualquier daño directo o indirecto resultante de decisiones tomadas en base a las funciones de IA.</p>
              <p className="mb-4"><strong>7. Responsabilidad del Usuario</strong><br/>Te recomendamos aplicar el sentido común: evita introducir contraseñas o datos personales altamente sensibles en el editor. El uso de esta herramienta y sus resultados es bajo tu propia y estricta responsabilidad.</p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 mb-1 mt-3">
      <p className="px-2 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1" style={{ fontFamily: "var(--font-ui)" }}>{label}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function SidebarLink({ label, active, onClick }: { label: string; active: boolean; onClick?: () => void }) {
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

export function PrimaryButton({ onClick, icon, label, disabled = false }: { onClick?: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn-primary-wrap flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ ...S.primaryBtn, fontFamily: "var(--font-ui)" }}
    >{icon}{label}</button>
  );
}

export function GhostButton({ onClick, icon, label, disabled = false }: { onClick?: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ ...S.ghostBtn, fontFamily: "var(--font-ui)" }}
    >{icon}{label}</button>
  );
}

export function ToolbarBtn({ onClick, title, children, disabled = false }: { onClick?: () => void; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ borderRadius: "calc(var(--radius) - 4px)" }}
    >{children}</button>
  );
}
