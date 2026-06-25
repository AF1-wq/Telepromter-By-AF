import React from "react";

export const S = {
  // Tarjetas: completamente planas, sin sombra, solo borde sutil
  floatCard: (): React.CSSProperties => ({
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    transition: "border-color 0.15s ease, transform 0.15s ease",
  }),

  // Paneles laterales y de editor: sin blur, fondo sólido
  panelGlass: {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
  } as React.CSSProperties,

  sidebar: {
    backgroundColor: "var(--sidebar)",
    borderRight: "1px solid var(--border)",
  } as React.CSSProperties,

  toolbar: {
    backgroundColor: "var(--card)",
    borderBottom: "1px solid var(--border)",
  } as React.CSSProperties,

  input: {
    backgroundColor: "var(--input-background)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  } as React.CSSProperties,

  iconBox: {
    background: "var(--muted)",
    border: "1px solid var(--border)",
  } as React.CSSProperties,

  primaryBtn: {
    background: "var(--primary)",
    borderRadius: "var(--radius)",
    color: "var(--primary-foreground)",
  } as React.CSSProperties,

  ghostBtn: {
    background: "var(--muted)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  } as React.CSSProperties,

  sidebarLinkActive: {
    background: "var(--muted)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    borderRadius: "calc(var(--radius) - 2px)",
  } as React.CSSProperties,

  tpControls: {
    backgroundColor: "var(--tp-controls-bg)",
    borderTop: "1px solid var(--tp-controls-border)",
  } as React.CSSProperties,

  tpPlayBtn: {
    borderRadius: "50%",
    background: "var(--tp-foreground)",
  } as React.CSSProperties,
};
