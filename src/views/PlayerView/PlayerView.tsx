import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useScripts } from '../../hooks/useScripts';
import { useBionicMode } from '../../hooks/useBionicMode';
import { X, RotateCcw, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { S } from '../../components/ui/SharedComponents';
import './PlayerView.css';

function SpeedArc({ speed, running }: { speed: number; running: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = (speed - 1) / 9; // 1-10 range -> 0-1
  const dash = circ * 0.75 * Math.max(0, Math.min(1, pct));
  const gap = circ - dash;
  const rotation = -225;

  return (
    <svg width={80} height={80} viewBox="0 0 80 80" className={running ? "arc-active" : ""} style={{ position: "absolute", inset: 0, margin: "auto" }} aria-hidden>
      <circle cx={40} cy={40} r={r} fill="none" stroke="var(--tp-btn-border)" strokeWidth={1.5} strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(${rotation} 40 40)`} />
      <circle cx={40} cy={40} r={r} fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray={`${dash} ${gap + circ * 0.25}`} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(${rotation} 40 40)`} style={{ transition: "stroke-dasharray 0.3s cubic-bezier(0.16,1,0.3,1)" }} />
    </svg>
  );
}

function KnobBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-6 h-6 flex items-center justify-center transition-colors" style={{ borderRadius: "calc(var(--radius) - 10px)", color: "var(--tp-btn-color)" }} onMouseEnter={e => (e.currentTarget.style.color = "var(--tp-foreground)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--tp-btn-color)")}>
      {children}
    </button>
  );
}

function KnobControl({ label, value, onDec, onInc }: { label: string; value: string; onDec: () => void; onInc: () => void }) {
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

function TpButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all" style={{ borderRadius: "var(--radius)", border: "1px solid var(--tp-btn-border)", color: "var(--tp-btn-color)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--tp-foreground)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--tp-btn-color)"; }}>
      {children}
    </button>
  );
}

export const PlayerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getScript, saveScript } = useScripts();
  const { bionicMode } = useBionicMode();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(48);
  const [speed, setSpeed] = useState(5);
  const [isMirrored, setIsMirrored] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorVisible, setCursorVisible] = useState(false);

  const wordCount = useMemo(() => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
    return text ? text.split(/\s+/).length : 0;
  }, [content]);

  const estimatedTime = useMemo(() => {
    const wpm = 25 + speed * 25;
    const minutes = wordCount / wpm;
    return Math.ceil(minutes * 60);
  }, [wordCount, speed]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      const script = getScript(id);
      if (script) {
        setContent(script.content);
        setTitle(script.title);
        if (script.savedFontSize) setFontSize(script.savedFontSize);
        if (script.savedSpeed) setSpeed(script.savedSpeed);
      } else {
        navigate('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  useEffect(() => {
    if (id && content) {
      const script = getScript(id);
      if (script && (script.savedFontSize !== fontSize || script.savedSpeed !== speed)) {
        saveScript({
          ...script,
          savedFontSize: fontSize,
          savedSpeed: speed
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, speed]);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        console.log(`Wake Lock Error: ${err.name}, ${err.message}`);
      }
    };
    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (err) {
          console.error(err);
        }
      }
    };
    if (isPlaying) requestWakeLock();
    else releaseWakeLock();
    return () => { releaseWakeLock(); };
  }, [isPlaying]);

  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    let lastTime = performance.now();
    let accumulatedFloat = 0;

    const scrollStep = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      if (scrollContainerRef.current) {
        accumulatedFloat += (speedRef.current * 0.02 * delta);
        if (accumulatedFloat >= 1) {
          const pixels = Math.floor(accumulatedFloat);
          scrollContainerRef.current.scrollTop += pixels;
          accumulatedFloat -= pixels;
        }
        animationRef.current = requestAnimationFrame(scrollStep);
      }
    };
    animationRef.current = requestAnimationFrame(scrollStep);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      setIsPlaying(true);
    }
  }, [countdown]);

  const isPlayingOrCountdown = isPlaying || countdown !== null;

  const handlePlayPause = () => {
    if (isPlayingOrCountdown) {
      setIsPlaying(false);
      setCountdown(null);
    } else {
      setCountdown(3);
    }
  };

  const handleRestart = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setElapsedTime(0);
    if (isPlayingOrCountdown) {
      setIsPlaying(false);
      setCountdown(null);
    }
  };

  const handleUserInteraction = () => {
    if (isPlayingOrCountdown) {
      setIsPlaying(false);
      setCountdown(null);
    }
  };

  useEffect(() => {
    if (hudMessage) {
      const timer = setTimeout(() => setHudMessage(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [hudMessage]);

  const showHud = (message: string) => setHudMessage(message);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); handlePlayPause(); break;
        case 'ArrowUp': e.preventDefault(); setSpeed(prev => { const n = Math.min(prev + 1, 10); showHud(`Velocidad: ${n}x`); return n; }); break;
        case 'ArrowDown': e.preventDefault(); setSpeed(prev => { const n = Math.max(prev - 1, 1); showHud(`Velocidad: ${n}x`); return n; }); break;
        case 'ArrowRight': e.preventDefault(); setFontSize(prev => { const n = Math.min(prev + 4, 120); showHud(`Tamaño: ${n}px`); return n; }); break;
        case 'ArrowLeft': e.preventDefault(); setFontSize(prev => { const n = Math.max(prev - 4, 24); showHud(`Tamaño: ${n}px`); return n; }); break;
        case 'Escape': e.preventDefault(); navigate(`/editor/${id}`); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingOrCountdown, navigate, id]);

  const renderedContent = useMemo(() => {
    if (!bionicMode || !content) return { __html: content };
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          const words = node.nodeValue.split(/(\s+)/);
          const fragment = document.createDocumentFragment();
          let changed = false;
          words.forEach(word => {
            if (word.trim().length > 0 && /^[A-Za-zÀ-ÿ]+[A-Za-zÀ-ÿ.,:;!?]*$/.test(word)) {
              changed = true;
              const cleanWord = word.replace(/[.,:;!?]+$/, '');
              const punctuation = word.substring(cleanWord.length);
              if (cleanWord.length > 2) {
                const pivot = Math.ceil(cleanWord.length / 2);
                const firstHalf = cleanWord.substring(0, pivot);
                const secondHalf = cleanWord.substring(pivot);
                const b = document.createElement('b');
                b.className = 'bionic-bold';
                b.textContent = firstHalf;
                fragment.appendChild(b);
                fragment.appendChild(document.createTextNode(secondHalf + punctuation));
              } else {
                fragment.appendChild(document.createTextNode(word));
              }
            } else {
              fragment.appendChild(document.createTextNode(word));
            }
          });
          if (changed && node.parentNode) node.parentNode.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE' && element.tagName !== 'B') {
            Array.from(element.childNodes).forEach(processNode);
          }
        }
      };
      Array.from(doc.body.childNodes).forEach(processNode);
      return { __html: doc.body.innerHTML };
    } catch (e) {
      console.error(e);
      return { __html: content };
    }
  }, [bionicMode, content]);

  return (
    <div
      className="fixed inset-0 flex flex-col tp-cursor view-in"
      style={{ zIndex: 50, background: "var(--tp-background)", contain: "strict" }}
      onMouseMove={(e) => { setCursorPos({ x: e.clientX, y: e.clientY }); setCursorVisible(true); }}
      onMouseLeave={() => setCursorVisible(false)}
    >
      {cursorVisible && (
        <div className="tp-cursor-dot" style={{ left: cursorPos.x, top: cursorPos.y, opacity: cursorVisible ? 1 : 0 }} aria-hidden />
      )}

      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 60, background: "var(--tp-overlay-bg)", backdropFilter: "blur(12px)" }}>
          <span className="countdown-num font-semibold" style={{ fontFamily: "var(--font-ui)", fontSize: "clamp(6rem, 20vw, 12rem)", color: "var(--tp-foreground)", letterSpacing: "-0.05em", lineHeight: 1 }}>
            {countdown}
          </span>
        </div>
      )}

      {hudMessage && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 rounded-full font-bold shadow-lg" style={{ zIndex: 60 }}>
          {hudMessage}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden select-none tp-scroll tp-ready ${bionicMode ? 'bionic-active' : ''}`}
        style={{ padding: "22vh 10vw 0", transform: isMirrored ? "scaleX(-1)" : undefined }}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
        onMouseDown={handleUserInteraction}
      >
        <p
          className="pb-[60vh] prompter-text"
          style={{
            color: "var(--tp-foreground)",
            fontFamily: "var(--font-reading)",
            fontSize: `${fontSize}px`,
            lineHeight: "1.65",
            fontWeight: 300,
            letterSpacing: "0.005em",
          }}
          dangerouslySetInnerHTML={renderedContent}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: "20vh", background: "var(--tp-fade-top)" }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-[80px]" style={{ height: "22vh", background: "var(--tp-fade-bottom)" }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0" style={{ top: "37%", height: 1, background: "var(--tp-focus-line)" }} aria-hidden />

      <div className="relative z-10 flex items-center justify-between px-7 py-4" style={S.tpControls}>
        <div className="flex items-center gap-2 w-44">
          {/* Apple Traffic Lights for consistency */}
          <div className="flex items-center gap-1.5 mr-4">
            {(["--traffic-red", "--traffic-yellow", "--traffic-green"] as const).map(v => (
              <div key={v} style={{ width: 12, height: 12, borderRadius: "50%", background: `var(${v})`, opacity: 0.85 }} />
            ))}
          </div>

          <TpButton onClick={() => navigate(`/editor/${id}`)}><X size={12} />Salir</TpButton>
          <button
            onClick={handleRestart}
            className="w-8 h-8 flex items-center justify-center transition-colors"
            style={{ borderRadius: "var(--radius)", border: "1px solid var(--tp-btn-border)", color: "var(--tp-btn-color)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--tp-foreground)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--tp-btn-color)")}
            title="Reiniciar"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="flex items-center gap-8">
          <KnobControl label="Velocidad" value={speed.toFixed(1)}
            onDec={() => setSpeed(Math.max(1, speed - 1))}
            onInc={() => setSpeed(Math.min(10, speed + 1))} />

          <div className="relative flex items-center justify-center">
            <SpeedArc speed={speed} running={isPlaying} />
            <button
              onClick={handlePlayPause}
              className="w-14 h-14 flex items-center justify-center transition-all active:scale-90"
              style={{ ...S.tpPlayBtn, position: "relative", zIndex: 1 }}
            >
              {isPlayingOrCountdown
                ? <Pause size={20} style={{ fill: "var(--tp-play-icon)" }} strokeWidth={0} />
                : <Play size={20} style={{ fill: "var(--tp-play-icon)", marginLeft: 2 }} strokeWidth={0} />}
            </button>
          </div>

          <KnobControl label="Tamaño" value={`${fontSize}`}
            onDec={() => setFontSize(Math.max(24, fontSize - 4))}
            onInc={() => setFontSize(Math.min(120, fontSize + 4))} />
        </div>

        <div className="flex items-center gap-2 w-44 justify-end">
          <div className="timer-display" style={{ color: "var(--tp-label-color)", fontFamily: "var(--font-mono)", fontSize: "11px", marginRight: '10px' }}>
            {formatTime(elapsedTime)} / {formatTime(estimatedTime)}
          </div>
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className="px-3 py-1.5 text-[11px] font-medium transition-all"
            style={{
              borderRadius: "var(--radius)",
              border: `1px solid ${isMirrored ? "var(--tp-mirror-border)" : "var(--tp-btn-border)"}`,
              color: isMirrored ? "var(--tp-mirror-text)" : "var(--tp-btn-color)",
              background: isMirrored ? "var(--tp-mirror-accent)" : "transparent",
            }}
          >Espejo</button>
          <p className="text-[10px] max-w-[80px] truncate" style={{ color: "var(--tp-label-color)", fontFamily: "var(--font-mono)" }}>
            {title}
          </p>
        </div>
      </div>
    </div>
  );
};
