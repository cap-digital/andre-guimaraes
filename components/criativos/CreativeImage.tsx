"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export function CreativeImage({ src, alt }: { src: string; alt: string }) {
  const [erro, setErro] = useState(false);
  const proxied = src ? `/api/img?u=${encodeURIComponent(src)}` : "";

  if (!src || erro) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-canvas to-brand-50 text-muted">
        <ImageOff size={28} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxied}
      alt={alt}
      loading="lazy"
      onError={() => setErro(true)}
      className="aspect-square w-full bg-canvas object-cover transition duration-300 group-hover:scale-[1.03]"
    />
  );
}
