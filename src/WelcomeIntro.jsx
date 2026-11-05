import { ArrowRight, BookOpen, Brain, ChartNoAxesCombined, GraduationCap, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import BrandMark from './BrandMark.jsx';
import './welcome.css';

export default function WelcomeIntro({ user, onContinue }) {
  const actionRef = useRef(null);

  useEffect(() => {
    const target = actionRef.current;
    if (!target) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    let frameId = 0;
    let cancelled = false;
    const startY = window.scrollY;
    const targetY = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        target.getBoundingClientRect().top + startY - (window.innerHeight - target.offsetHeight) / 2
      )
    );
    const distance = targetY - startY;
    const duration = 2200;
    let startTime = 0;

    const stopScroll = () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
    const handleKeyDown = (event) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stopScroll();
    };

    if (Math.abs(distance) > 12) {
      window.addEventListener('wheel', stopScroll, { passive: true, once: true });
      window.addEventListener('touchstart', stopScroll, { passive: true, once: true });
      window.addEventListener('pointerdown', stopScroll, { passive: true, once: true });
      window.addEventListener('keydown', handleKeyDown);

      const animate = (now) => {
        if (cancelled) return;
        if (!startTime) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, startY + distance * eased);
        if (progress < 1) frameId = window.requestAnimationFrame(animate);
      };
      frameId = window.requestAnimationFrame(animate);
    }

    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('wheel', stopScroll);
      window.removeEventListener('touchstart', stopScroll);
      window.removeEventListener('pointerdown', stopScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <main className="em-welcome">
      <div className="em-welcome__glow em-welcome__glow--one" aria-hidden="true" />
      <div className="em-welcome__glow em-welcome__glow--two" aria-hidden="true" />
      <header className="em-welcome__header">
        <a className="em-welcome__brand" href="#welcome" aria-label="ENGLISH MASTER">
          <BrandMark />
          <span>ENGLISH <b>MASTER</b></span>
        </a>
        <div className="em-welcome__account">
          {user?.picture && <img src={user.picture} alt="" />}
          <span>{user?.name ? `Salom, ${user.name.split(' ')[0]}` : 'Xush kelibsiz'}</span>
        </div>
      </header>

      <section className="em-welcome__hero" id="welcome">
        <div className="em-welcome__eyebrow"><Sparkles size={15} /> YOUR ENGLISH JOURNEY STARTS HERE</div>
        <div className="em-welcome__mark"><BrandMark /></div>
        <p className="em-welcome__overline">WELCOME TO</p>
        <h1>ENGLISH <span>MASTER</span></h1>
        <p className="em-welcome__quote">“Master English. Shape your future.”</p>
        <p className="em-welcome__description">Ingliz tilini ishonch bilan o‘rganing, bilimingizni rivojlantiring va maqsadlaringiz sari dadil qadam tashlang.</p>
      </section>

      <section className="em-welcome__features" aria-label="English Master imkoniyatlari">
        <article><span><BookOpen size={22} /></span><h2>Vocabulary &amp; Grammar</h2><p>So‘z boyligingizni kengaytiring va grammatikani mustahkamlang.</p></article>
        <article><span><Brain size={22} /></span><h2>AI bilan o‘rganish</h2><p>Interaktiv mashqlar orqali bilim va ishonchingizni oshiring.</p></article>
        <article><span><ChartNoAxesCombined size={22} /></span><h2>CEFR &amp; IELTS</h2><p>Darajangizni tekshiring va keyingi maqsadingizni belgilang.</p></article>
      </section>

      <section ref={actionRef} className="em-welcome__action" aria-label="O‘rganishni boshlash">
        <button className="em-welcome__cta" onClick={onContinue}>
          <span>Biz bilan yuqori natijalarga erishing</span>
          <ArrowRight size={23} />
        </button>
        <p className="em-welcome__hint">Sizning rivojlanishingiz — bizning maqsadimiz.</p>
      </section>

      <footer className="em-welcome__footer"><GraduationCap size={17} /> Learn with purpose. Achieve more.</footer>
    </main>
  );
}
