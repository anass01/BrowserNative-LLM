/**
 * components/AdSidebar.tsx
 * Right sidebar — reserved for monetization / sponsored content.
 * Non-intrusive, clearly labeled, separated from chat flow.
 */
"use client";

import { ExternalLink } from "lucide-react";

export function AdSidebar() {
  return (
    <aside
      aria-label="Sponsored content"
      className="hidden xl:flex shrink-0 w-56 h-full flex-col
        border-l border-[#1e1e22] bg-[#0d0d0f] p-3 gap-3"
    >
      <p className="text-[10px] font-medium text-[#3f3f46] uppercase tracking-widest px-1">
        Sponsored
      </p>

      {/* Ad slot 1 */}
      <AdSlot
        title="Deploy AI Apps"
        description="Ship production AI faster with Vercel's edge platform."
        href="#"
        tag="Cloud"
      />

      {/* Ad slot 2 */}
      <AdSlot
        title="Your Ad Here"
        description="Reach privacy-first AI users. Contact us to advertise."
        href="#"
        tag="Advertise"
      />

      <div className="flex-1" />

      <p className="text-[10px] text-[#27272a] text-center leading-relaxed">
        Ads help keep this tool free. They never track you.
      </p>
    </aside>
  );
}

function AdSlot({
  title,
  description,
  href,
  tag,
}: {
  title: string;
  description: string;
  href: string;
  tag: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group block rounded-xl border border-[#1e1e22] bg-[#111113]
        px-3 py-3.5 hover:border-[#27272a] hover:bg-[#18181c]
        transition-all duration-150 no-underline"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider
          text-[#6366f1] bg-[#6366f1]/10 px-1.5 py-0.5 rounded">
          {tag}
        </span>
        <ExternalLink
          size={10}
          className="text-[#3f3f46] group-hover:text-[#52525b] transition-colors"
        />
      </div>
      <p className="text-xs font-semibold text-[#a1a1aa] group-hover:text-[#f0f0f2]
        transition-colors mb-1">
        {title}
      </p>
      <p className="text-[11px] text-[#52525b] leading-relaxed">
        {description}
      </p>
    </a>
  );
}
