"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface Category {
  id: string;
  name: string;
}

export function CategoryNav({ categories }: { categories: Category[] }) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id || "");
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const isClickScrolling = useRef(false);

  // Scrollspy: observe which category section is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Small delay to let the DOM settle
    const timeout = setTimeout(() => {
      categories.forEach((cat) => {
        const el = document.getElementById(`category-${cat.id}`);
        if (!el) return;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !isClickScrolling.current) {
                setActiveId(cat.id);
              }
            });
          },
          {
            // The rootMargin accounts for the sticky header height (~160px)
            // We trigger when the section's top enters the zone just below the header
            rootMargin: "-160px 0px -60% 0px",
            threshold: 0,
          }
        );

        observer.observe(el);
        observers.push(observer);
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      observers.forEach((obs) => obs.disconnect());
    };
  }, [categories]);

  // Auto-scroll the nav to keep the active tab visible
  useEffect(() => {
    const activeLink = linkRefs.current[activeId];
    if (activeLink && navRef.current) {
      const nav = navRef.current;
      const linkLeft = activeLink.offsetLeft;
      const linkWidth = activeLink.offsetWidth;
      const navWidth = nav.offsetWidth;
      const scrollTarget = linkLeft - navWidth / 2 + linkWidth / 2;
      nav.scrollTo({ left: scrollTarget, behavior: "smooth" });
    }
  }, [activeId]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, categoryId: string) => {
      e.preventDefault();
      const el = document.getElementById(`category-${categoryId}`);
      if (!el) return;

      setActiveId(categoryId);
      isClickScrolling.current = true;

      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // Re-enable scrollspy after the scroll animation completes
      setTimeout(() => {
        isClickScrolling.current = false;
      }, 800);
    },
    []
  );

  return (
    <nav
      ref={navRef}
      className="px-6 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-8 border-b border-white/5 sticky top-[108px] z-10 bg-[var(--color-brand-bg-dark)]/90 backdrop-blur-md"
    >
      {categories.map((category) => {
        const isActive = activeId === category.id;
        return (
          <a
            key={category.id}
            ref={(el) => { linkRefs.current[category.id] = el; }}
            href={`#category-${category.id}`}
            onClick={(e) => handleClick(e, category.id)}
            className={`text-[11px] uppercase tracking-[0.15em] font-medium transition-colors duration-200 pb-1 shrink-0 ${
              isActive
                ? "text-[var(--color-brand-gold)] border-b border-[var(--color-brand-gold)]"
                : "text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] border-b border-transparent"
            }`}
          >
            {category.name}
          </a>
        );
      })}
    </nav>
  );
}
