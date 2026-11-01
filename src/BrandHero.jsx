import { ChevronDown } from 'lucide-react';
import BrandMark from './BrandMark.jsx';

// Brand band for the top of the home page. The site's own top bar (nav + Google
// account chip) is NOT duplicated here — it stays the single navigation.
export default function BrandHero() {
  return (
    <section className="em-hero em-hero--band" aria-labelledby="em-hero-title">
      <div className="em-hero__bg" aria-hidden="true">
        <div className="em-hero__grid"></div>
        <svg className="em-hero__net" viewBox="0 0 520 300" fill="none" focusable="false">
          <line x1="40" y1="230" x2="150" y2="160" /><line x1="150" y1="160" x2="260" y2="200" />
          <line x1="260" y1="200" x2="360" y2="110" /><line x1="360" y1="110" x2="470" y2="150" />
          <line x1="150" y1="160" x2="230" y2="70" /><line x1="230" y1="70" x2="360" y2="110" />
          <line x1="360" y1="110" x2="430" y2="40" />
          <circle cx="40" cy="230" r="3" /><circle cx="150" cy="160" r="4" /><circle cx="260" cy="200" r="3" />
          <circle cx="470" cy="150" r="3" /><circle cx="230" cy="70" r="3" /><circle cx="430" cy="40" r="3" />
          <circle className="em-node-gold" cx="360" cy="110" r="4.5" />
        </svg>
      </div>

      <div className="em-hero__inner">
        <span className="em-eyebrow"><i></i>IELTS &amp; CEFR · AI yordamida</span>
        <BrandMark className="em-hero__mark" />
        <h1 className="em-wordmark" id="em-hero-title"><span>English</span> <span>Master</span></h1>
        <div className="em-rule" aria-hidden="true"></div>
        <blockquote className="em-quote"><p>“Your Future Speaks English.”</p></blockquote>
        <div className="em-hero__actions">
          <a className="em-scroll" href="#em-start" aria-label="Pastga — o‘rganishni boshlash"><ChevronDown size={20} /></a>
        </div>
      </div>
    </section>
  );
}
