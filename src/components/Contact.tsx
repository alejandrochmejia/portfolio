import type { ReactNode } from 'react'
import { useCopy } from '../i18n.ts'
import './Contact.css'

type Link = { id: string; href: string; label: string; icon: ReactNode }

const LINKS: Link[] = [
  {
    id: 'github',
    href: 'https://github.com/alejandrochmejia',
    label: 'GitHub',
    icon: (
      <path
        fill="currentColor"
        d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"
      />
    ),
  },
  {
    id: 'linkedin',
    href: 'https://www.linkedin.com/in/alejandrochmejia',
    label: 'LinkedIn',
    icon: (
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45Z"
      />
    ),
  },
  {
    id: 'instagram',
    href: 'https://www.instagram.com/alejandrochmejia',
    label: 'Instagram',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3" y="3" width="18" height="18" rx="5.2" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  {
    id: 'email',
    href: 'mailto:alejandrochmejia@gmail.com',
    label: 'Email',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="m3.5 7 8.5 6.2L20.5 7" />
      </g>
    ),
  },
]

const COPY = {
  es: { list: 'Redes y contacto', email: 'Enviar un email' },
  en: { list: 'Socials and contact', email: 'Send an email' },
}

/** The four chrome circle links (also shown at the bottom of the menu). */
export function ContactLinks({ className = '' }: { className?: string }) {
  const t = useCopy(COPY)
  return (
    <ul className={`contact__links ${className}`} aria-label={t.list}>
      {LINKS.map((l) => (
        <li key={l.id}>
          <a
            className="contact__btn"
            href={l.href}
            {...(l.id === 'email' ? {} : { target: '_blank', rel: 'noreferrer' })}
            aria-label={l.id === 'email' ? `${t.email} (alejandrochmejia@gmail.com)` : l.label}
            title={l.label}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {l.icon}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Closing section: chrome title + the chrome circle links. */
export function Contact() {
  return (
    <section className="contact" aria-labelledby="contact-title">
      <h2 id="contact-title" className="contact__title y2k-chrome">
        Contact me
      </h2>
      <ContactLinks />
    </section>
  )
}
