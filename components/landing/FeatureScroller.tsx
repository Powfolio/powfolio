"use client";

import { useEffect, useRef } from "react";

export type FeatureCard = {
  title: string;
  desc: string;
  image: string;
  imageAlt: string;
};

const DEFAULT: FeatureCard[] = [
  {
    title: "Trading Record",
    desc: "Share live trades, ROI, update threads, win rate. A track record teams can actually review.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Trading candlestick charts on a dark screen",
  },
  {
    title: "Onchain Stats",
    desc: "Wallet value, fees, last activity, contracts. A chain footprint viewers can tap.",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Blockchain network nodes and onchain analytics",
  },
  {
    title: "Collectibles",
    desc: "The NFTs you hold, on your page. Art, badges, and proof that you were early.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Abstract digital art and collectible pieces",
  },
  {
    title: "Multi-wallet",
    desc: "Name extra wallets and let viewers switch between them. One profile, every chain you touch.",
    image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Multiple crypto wallets and devices",
  },
  {
    title: "Technical Writing",
    desc: "Threads, essays, research. How you think, published in one place.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Notebook and writing tools on a desk",
  },
  {
    title: "Community Roles",
    desc: "Mods, campaigns, DAO work. Roles with context, not empty titles.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Team collaborating around a laptop",
  },
  {
    title: "Airdrops & Testnets",
    desc: "Campaigns farmed, chains touched, points earned. A clean list that shows you show up.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Tokens and network activity",
  },
  {
    title: "Skill pillars",
    desc: "Named skills with a short proof-backed brief. Not random tags.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Learning and skill building at a workspace",
  },
  {
    title: "Profile & Builder scores",
    desc: "Two public scores. Completeness and evidence density, easy to read.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Analytics dashboard with charts and metrics",
  },
  {
    title: "Private CV",
    desc: "Your profile as a resume you send. Visitors cannot download it.",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Clean resume document on a desk",
  },
];

function Arrow({ dir }: { dir: "left" | "right" }) {
  const d = dir === "left" ? "M15 5 L7 12 L15 19" : "M9 5 L17 12 L9 19";
  return (
    <svg width="22" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FeatureScroller({ items = DEFAULT }: { items?: FeatureCard[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const targetRef = useRef(0);
  const lastYRef = useRef(0);
  const rafRef = useRef(0);
  const pauseUntil = useRef(0);

  function maxOffset() {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return 0;
    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  }

  function apply(x: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(maxOffset(), Math.max(0, x));
    offsetRef.current = clamped;
    track.style.transform = "translate3d(" + -clamped + "px,0,0)";
  }

  function nudge(dir: number) {
    pauseUntil.current = Date.now() + 1600;
    const viewport = viewportRef.current;
    const step = Math.min(340, (viewport?.clientWidth || 320) * 0.78);
    targetRef.current = Math.min(maxOffset(), Math.max(0, targetRef.current + dir * step));
  }

  useEffect(() => {
    lastYRef.current = window.scrollY;

    function tick() {
      const current = offsetRef.current;
      const target = targetRef.current;
      const next = current + (target - current) * 0.16;
      if (Math.abs(next - target) < 0.35) apply(target);
      else apply(next);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    function onScroll() {
      const y = window.scrollY;
      const dy = y - lastYRef.current;
      lastYRef.current = y;
      if (Date.now() < pauseUntil.current) return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (rect.bottom < 64 || rect.top > vh - 64) return;
      targetRef.current = Math.min(maxOffset(), Math.max(0, targetRef.current + dy * 0.9));
    }

    function onResize() {
      targetRef.current = Math.min(maxOffset(), targetRef.current);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section id="features" ref={sectionRef} className="pb-20 sm:pb-28">
      <div className="container-app">
        <div className="mb-8">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground-subtle">What Powfolio does</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Proof sections that move with you</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground-muted">Each block on your public page is a piece of work someone can review. Swipe the reel or let the page scroll it.</p>
          </div>
        </div>
      </div>
      <div ref={viewportRef} className="relative overflow-hidden px-[max(1rem,calc((100vw-72rem)/2+1rem))]"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          (e.currentTarget as HTMLElement).dataset.sx = String(e.clientX);
          (e.currentTarget as HTMLElement).dataset.ox = String(targetRef.current);
        }}
        onPointerMove={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (!el.hasPointerCapture(e.pointerId)) return;
          const sx = Number(el.dataset.sx || 0);
          const ox = Number(el.dataset.ox || 0);
          const dx = sx - e.clientX;
          targetRef.current = Math.min(maxOffset(), Math.max(0, ox + dx));
          pauseUntil.current = Date.now() + 800;
        }}
        onPointerUp={(e) => {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }}
      >
        <button type="button" onClick={() => nudge(-1)} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/60 sm:left-6" aria-label="Previous">
          <Arrow dir="left" />
        </button>
        <button type="button" onClick={() => nudge(1)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/60 sm:right-6" aria-label="Next">
          <Arrow dir="right" />
        </button>
        <div ref={trackRef} className="flex gap-4 will-change-transform touch-pan-y" style={{ transform: "translate3d(0,0,0)" }}>
          {items.map((card) => (
            <article key={card.title} className="group relative h-[22rem] w-[min(86vw,22rem)] shrink-0 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt={card.imageAlt} className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-5">
                <h3 className="text-2xl font-bold tracking-tight text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{card.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
