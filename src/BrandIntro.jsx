import { useEffect, useRef } from 'react';
import BrandMark from './BrandMark.jsx';
import './brand-intro.css';

function playWhooshAndChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Soft airy whoosh as the line draws.
    const length = Math.floor(ctx.sampleRate * 0.42);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const fade = Math.pow(1 - i / length, 2);
      data[i] = (Math.random() * 2 - 1) * fade;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.38);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.43);

    // Bright, short "ting" when the mark settles in the centre.
    const oscillator = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now + 1.12);
    oscillator.frequency.exponentialRampToValueAtTime(1320, now + 1.22);
    chimeGain.gain.setValueAtTime(0.0001, now + 1.12);
    chimeGain.gain.exponentialRampToValueAtTime(0.13, now + 1.15);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);
    oscillator.connect(chimeGain).connect(ctx.destination);
    oscillator.start(now + 1.12);
    oscillator.stop(now + 1.67);
    window.setTimeout(() => ctx.close().catch(() => {}), 1900);
  } catch {
    // Some browsers block audio until the first user interaction; animation still plays.
  }
}

export default function BrandIntro({ onComplete }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    playWhooshAndChime();
    const timer = window.setTimeout(onComplete, 2700);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="em-intro" aria-label="English Master intro">
      <div className="em-intro__scene">
        <div className="em-intro__line" aria-hidden="true" />
        <div className="em-intro__mark-wrap"><BrandMark className="em-intro__mark" /></div>
        <div className="em-intro__wordmark"><span>ENGLISH</span><b>MASTER</b></div>
        <p className="em-intro__tagline">Your Future Speaks English.</p>
      </div>
    </main>
  );
}
