"use client";

import { formatArPhone } from "@/lib/phone";
import {
  IconWhatsApp,
  IconEmail,
  IconPhone,
  IconGlobe,
  IconMapPin,
  IconRedes,
} from "./icons";
import type { Prospecto } from "@/lib/types";

/**
 * Los canales de contacto de un prospecto, como chips clickeables. Adaptado
 * de `ContactDots` de FORCOM: el chip ES la acción (abre `wa.me`, `mailto:`,
 * `tel:`, el sitio o Maps), no solo informa.
 *
 * Los 5 canales principales (WhatsApp, email, teléfono, sitio, Maps) tienen
 * posición fija — con ellos o sin ellos, el ojo aprende dónde está cada uno
 * en una lista larga. Las redes sociales van variables al final: rara vez
 * hay más de una o dos, y fijar tres posiciones para eso desperdicia ancho.
 */

const CHIP = "inline-flex items-center justify-center p-1.5 rounded-md border transition-colors";
const CHIP_OFF = "text-slate-300 border-dashed border-slate-200 bg-transparent cursor-default";

const TONO = {
  whatsapp: "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
  email: "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100",
  telefono: "text-teal-600 border-teal-200 bg-teal-50 hover:bg-teal-100",
  web: "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100",
  maps: "text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100",
  redes: "text-fuchsia-600 border-fuchsia-200 bg-fuchsia-50 hover:bg-fuchsia-100",
} as const;

interface Canal {
  key: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  on: boolean;
  color: string;
}

export default function ContactChips({ p, size = "w-4 h-4" }: { p: Prospecto; size?: string }) {
  const principales: Canal[] = [
    {
      key: "wa",
      icon: <IconWhatsApp className={size} />,
      label: p.whatsapp ? `WhatsApp — ${formatArPhone(p.whatsapp)}` : "Sin WhatsApp",
      href: p.whatsapp ? `https://wa.me/${p.whatsapp}` : undefined,
      on: Boolean(p.whatsapp),
      color: TONO.whatsapp,
    },
    {
      key: "email",
      icon: <IconEmail className={size} />,
      label: p.email ? `Escribir a ${p.email}` : "Sin email",
      href: p.email ? `mailto:${p.email}` : undefined,
      on: Boolean(p.email),
      color: TONO.email,
    },
    {
      key: "tel",
      icon: <IconPhone className={size} />,
      label: p.telefono ? `Llamar a ${formatArPhone(p.telefono)}` : "Sin teléfono",
      href: p.telefono ? `tel:+${p.telefono}` : undefined,
      on: Boolean(p.telefono),
      color: TONO.telefono,
    },
    {
      key: "web",
      icon: <IconGlobe className={size} />,
      label: p.sitio_web ? `Abrir ${p.sitio_web}` : "Sin sitio web",
      href: p.sitio_web ?? undefined,
      on: Boolean(p.sitio_web),
      color: TONO.web,
    },
    {
      key: "maps",
      icon: <IconMapPin className={size} />,
      label: p.maps_url ? "Ver en Google Maps" : "Sin ficha de Google Maps",
      href: p.maps_url ?? undefined,
      on: Boolean(p.maps_url),
      color: TONO.maps,
    },
  ];

  const redes = [
    { nombre: "Instagram", url: p.redes?.instagram },
    { nombre: "Facebook", url: p.redes?.facebook },
    { nombre: "LinkedIn", url: p.redes?.linkedin ?? p.linkedin_url },
  ].filter((r): r is { nombre: string; url: string } => Boolean(r.url));

  return (
    <div className="flex flex-nowrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {principales.map((c) =>
        c.on ? (
          <a
            key={c.key}
            href={c.href}
            title={c.label}
            aria-label={c.label}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`${CHIP} ${c.color}`}
          >
            {c.icon}
          </a>
        ) : (
          <span key={c.key} title={c.label} className={`${CHIP} ${CHIP_OFF}`}>
            {c.icon}
          </span>
        )
      )}

      {redes.map((r) => (
        <a
          key={r.nombre}
          href={r.url}
          title={`${r.nombre} — ${r.url}`}
          aria-label={`Abrir ${r.nombre}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`${CHIP} ${TONO.redes}`}
        >
          <IconRedes className={size} />
        </a>
      ))}
    </div>
  );
}
