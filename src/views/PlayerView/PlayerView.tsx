import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useScripts } from '../../hooks/useScripts';
import { useReadingMode } from '../../hooks/useReadingMode';
import { useBionicMode } from '../../hooks/useBionicMode';
import './PlayerView.css';

export const PlayerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getScript, saveScript } = useScripts();
  const { mode } = useReadingMode();
  const { bionicMode } = useBionicMode();

  const [content, setContent] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(48);
  const [speed, setSpeed] = useState(5);
  const [isMirrored, setIsMirrored] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const wordCount = useMemo(() => {
    const text = content.replace(/<[^>]*>?/gm, '').trim();
    return text ? text.split(' ').length : 0;
  }, [content]);

  const estimatedTime = useMemo(() => {
    // Estimación dinámica: speed 1 -> 50 wpm, speed 5 -> 150 wpm, speed 10 -> 275 wpm
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
  const pipWindowRef = useRef<Window | null>(null);

  // Cargar guion
  useEffect(() => {
    if (id) {
      const script = getScript(id);
      if (script) {
        setContent(script.content);
        if (script.savedFontSize) setFontSize(script.savedFontSize);
        if (script.savedSpeed) setSpeed(script.savedSpeed);
      } else {
        navigate('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // Guardar preferencias si cambian
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

  // Wake Lock API
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

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isPlaying]);

  // High-Performance Scroll Engine
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

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
        // Multiplier adjusted so speed 1-10 remains comfortable (approx 0.02 * 16ms = 0.32px per frame at 60fps)
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

  // Countdown Logic
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

  useEffect(() => {
    const onPipPlayPause = () => handlePlayPause();
    const onPipRestart = () => handleRestart();
    window.addEventListener('pip-play-pause-toggle', onPipPlayPause);
    window.addEventListener('pip-restart', onPipRestart);
    return () => {
      window.removeEventListener('pip-play-pause-toggle', onPipPlayPause);
      window.removeEventListener('pip-restart', onPipRestart);
    };
  }, [isPlayingOrCountdown]);

  // Handle user interaction to pause the animation
  const handleUserInteraction = () => {
    if (isPlayingOrCountdown) {
      setIsPlaying(false);
      setCountdown(null);
    }
  };

  const handleIncreaseSpeed = () => setSpeed(prev => Math.min(prev + 1, 10));
  const handleDecreaseSpeed = () => setSpeed(prev => Math.max(prev - 1, 1));

  // HUD clear timer
  useEffect(() => {
    if (hudMessage) {
      const timer = setTimeout(() => setHudMessage(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [hudMessage]);

  const showHud = (message: string) => {
    setHudMessage(message);
  };

  // Document Picture-in-Picture
  const handleTogglePiP = async () => {
    if (!('documentPictureInPicture' in window)) {
      showHud("Modo Flotante no soportado");
      return;
    }

    try {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        return;
      }

      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 450,
        height: 800,
      });

      pipWindowRef.current = pipWindow;
      
      if (scrollContainerRef.current) {
        pipWindow.document.body.appendChild(scrollContainerRef.current);
        
        // Copiar todos los estilos del document principal
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            if (styleSheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            } else if (styleSheet.cssRules) {
              const style = document.createElement('style');
              Array.from(styleSheet.cssRules).forEach((rule) => {
                style.appendChild(document.createTextNode(rule.cssText));
              });
              pipWindow.document.head.appendChild(style);
            }
          } catch (e) {
            console.warn('Cannot access stylesheet', e);
          }
        });

        // Copiar atributo de tema y modo
        pipWindow.document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'dark');
        pipWindow.document.body.classList.add(`mode-${mode}`);

        // Estilos específicos de PiP
        const customStyle = document.createElement('style');
        customStyle.textContent = `
          body { background: var(--color-bg-primary); color: var(--color-text-primary); margin: 0; padding: 20px; overflow: hidden; }
          body.mode-pro { background-color: #000000 !important; }
          body.mode-pro .prompter-text * { color: #FFFF00 !important; }
          body.mode-accessibility .prompter-text * { letter-spacing: 2px !important; line-height: 2.5 !important; }
          .prompter-text-area { height: 100vh; overflow-y: scroll; padding-bottom: 50vh; display: flex; align-items: flex-start; justify-content: center; mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); scrollbar-width: none; }
          .prompter-text-area::-webkit-scrollbar { display: none; }
          .focus-line-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.8) 35%, transparent 35%, transparent 65%, rgba(0,0,0,0.8) 65%, rgba(0,0,0,0.8) 100%); z-index: 5; }
          [data-theme='light'] .focus-line-overlay { background: linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 35%, transparent 35%, transparent 65%, rgba(255,255,255,0.8) 65%, rgba(255,255,255,0.8) 100%); }
          body .controls-bar-glass { opacity: 1 !important; transform: translateX(-50%) !important; bottom: 20px !important; }
          body.is-playing .controls-bar-glass { opacity: 0.1 !important; }
          body:hover .controls-bar-glass, body.is-playing:hover .controls-bar-glass { opacity: 1 !important; }
        `;
        pipWindow.document.head.appendChild(customStyle);

        // Add controls
        const pipControls = document.createElement('div');
        pipControls.className = 'controls-bar-glass';
        pipControls.innerHTML = '<div class="control-group"><button id="pip-restart" class="icon-btn" title="Reiniciar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button><button id="pip-play" class="play-pause-btn" title="Play/Pausa"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button><button id="pip-close" class="icon-btn" title="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>';
        pipWindow.document.body.appendChild(pipControls);

        pipWindow.document.getElementById('pip-restart')?.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('pip-restart'));
        });
        pipWindow.document.getElementById('pip-play')?.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('pip-play-pause-toggle'));
        });
        pipWindow.document.getElementById('pip-close')?.addEventListener('click', () => {
          pipWindow.close();
        });

        // Si es focus mode, añadir el overlay al body de PiP
        if (mode === 'focus') {
          const overlay = document.createElement('div');
          overlay.className = 'focus-line-overlay';
          pipWindow.document.body.appendChild(overlay);
        }

        pipWindow.addEventListener("pagehide", () => {
          if (scrollContainerRef.current) {
            document.querySelector('.player-container')?.insertBefore(
              scrollContainerRef.current,
              document.querySelector('.countdown-overlay') || document.querySelector('.controls-bar-glass')
            );
          }
          pipWindowRef.current = null;
        });
      }
    } catch (error) {
      console.error(error);
      showHud("Error al iniciar Modo Flotante");
    }
  };

  // Sync mode with PiP
  useEffect(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.document.body.className = `mode-${mode}`;
      if (isPlaying) {
        pipWindowRef.current.document.body.classList.add('is-playing');
      } else {
        pipWindowRef.current.document.body.classList.remove('is-playing');
      }
      
      const btn = pipWindowRef.current.document.getElementById('pip-play');
      if (btn) {
        if (isPlayingOrCountdown) {
          btn.classList.add('playing');
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        } else {
          btn.classList.remove('playing');
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        }
      }

      if (mode === 'focus') {
        let overlay = pipWindowRef.current.document.querySelector('.focus-line-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'focus-line-overlay';
          pipWindowRef.current.document.body.appendChild(overlay);
        }
      } else {
        const overlay = pipWindowRef.current.document.querySelector('.focus-line-overlay');
        if (overlay) overlay.remove();
      }
    }
  }, [mode, isPlaying, isPlayingOrCountdown]);

  // Hardware Remote Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSpeed(prev => {
            const next = Math.min(prev + 1, 10);
            showHud(`Velocidad: ${next}x`);
            return next;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSpeed(prev => {
            const next = Math.max(prev - 1, 1);
            showHud(`Velocidad: ${next}x`);
            return next;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFontSize(prev => {
            const next = Math.min(prev + 4, 120);
            showHud(`Tamaño: ${next}px`);
            return next;
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFontSize(prev => {
            const next = Math.max(prev - 4, 24);
            showHud(`Tamaño: ${next}px`);
            return next;
          });
          break;
        case 'Escape':
          e.preventDefault();
          navigate('/');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingOrCountdown, navigate]); // Depend on isPlayingOrCountdown to have the correct state for PlayPause

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
          
          if (changed && node.parentNode) {
            node.parentNode.replaceChild(fragment, node);
          }
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
    <div className={`player-container mode-${mode} ${bionicMode ? 'bionic-active' : ''} ${isPlaying ? 'is-playing' : ''}`}>
      {mode === 'focus' && <div className="focus-line-overlay" />}
      
      {/* Focus Marker */}
      <div className="focus-marker">
        <div className="focus-triangle left"></div>
        <div className="focus-line"></div>
        <div className="focus-triangle right"></div>
      </div>

      <div 
        className="prompter-text-area"
        ref={scrollContainerRef}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
        onMouseDown={handleUserInteraction}
      >
        <div 
          className="prompter-text"
          style={{ 
            fontSize: `${fontSize}px`,
            transform: isMirrored ? 'scaleX(-1)' : 'none'
          }}
          dangerouslySetInnerHTML={renderedContent}
        />
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="countdown-overlay">
          <span className="countdown-number">{countdown}</span>
        </div>
      )}

      {/* Transient HUD Overlay */}
      {hudMessage && (
        <div className="hud-overlay">
          <span className="hud-text">{hudMessage}</span>
        </div>
      )}

      <div className="controls-bar-glass w-full max-w-3xl flex justify-between items-center gap-4 px-4">
        <div className="control-group left-controls">
          <button className="icon-btn" onClick={handleRestart} title="Reiniciar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
          
          <div className="timer-display" style={{ marginLeft: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
            <span style={{color: 'var(--color-text-primary)'}}>{formatTime(elapsedTime)}</span> / {formatTime(estimatedTime)}
          </div>
        </div>

        <div className="control-group center-controls">
          <div className="slider-control" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '50px' }}>
            <span style={{color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 600}}>A</span>
            <input 
              type="range" 
              min="16" 
              max="150" 
              step="2" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              title="Tamaño de letra"
            />
            <span style={{color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: 600}}>A</span>
          </div>

          <button 
            className={`play-pause-btn ${isPlayingOrCountdown ? 'playing' : ''}`}
            onClick={handlePlayPause}
            title={isPlayingOrCountdown ? "Pausar" : "Reproducir"}
          >
            {isPlayingOrCountdown ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>

          <div className="stepper-control">
            <button className="stepper-btn" onClick={handleDecreaseSpeed} title="Reducir velocidad">-</button>
            <span className="stepper-value">{speed}x</span>
            <button className="stepper-btn" onClick={handleIncreaseSpeed} title="Aumentar velocidad">+</button>
          </div>
        </div>

        <div className="control-group right-controls">
          <button className="icon-btn" onClick={handleTogglePiP} title="Modo Flotante">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="12" y="12" width="7" height="5"></rect>
            </svg>
          </button>
          <button 
            className={`icon-btn ${isMirrored ? 'active' : ''}`} 
            onClick={() => setIsMirrored(!isMirrored)} 
            title="Modo Espejo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Vertical line and arrows to denote horizontal flip */}
              <path d="M12 2v20"></path>
              <path d="M17 16l4-4-4-4"></path>
              <path d="M7 16l-4-4 4-4"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

