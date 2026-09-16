import type { ReactNode } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { Link } from "./Link";
import "./Footer.css";

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type FooterSocial = {
  label: string;
  href: string;
  icon?: ReactNode;
};

export type FooterProps = {
  brand?: ReactNode;
  description?: string;
  columns?: FooterColumn[];
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socials?: FooterSocial[];
  newsletter?: {
    title?: string;
    description?: string;
    placeholder?: string;
    buttonLabel?: string;
    onSubmit?: (value: string) => void;
  };
  legalLinks?: FooterLink[];
  copyright?: string;
  className?: string;
};

export function Footer({
  brand,
  description,
  columns = [],
  contact,
  socials,
  newsletter,
  legalLinks = [],
  copyright,
  className = "",
}: FooterProps) {
  const hasBrand = Boolean(brand || description);
  const hasColumns = columns.length > 0;
  const hasContact = Boolean(contact?.email || contact?.phone || contact?.address);
  const socialLinks = socials ?? [];
  const hasSocials = socialLinks.length > 0;
  const newsletterConfig = newsletter ?? undefined;
  const hasNewsletter = Boolean(newsletterConfig);
  const hasLegal = legalLinks.length > 0 || Boolean(copyright);

  return (
    <footer className={["footer", className].filter(Boolean).join(" ")}>
      <div className="container footer__inner">
        <div className="footer__top">
          {hasBrand && (
            <div className="footer__brand-block">
              {brand || <div className="footer__brand">Brand</div>}
              {description && <p className="footer__description">{description}</p>}
            </div>
          )}

          {hasColumns && (
            <nav className="footer__nav" aria-label="Footer navigation">
              {columns.map((column) => (
                <div key={column.title} className="footer__column">
                  <h3 className="footer__heading">{column.title}</h3>
                  <ul className="footer__list">
                    {column.links.map((link) => (
                      <li key={link.href} className="footer__list-item">
                        <Link href={link.href} variant="muted" size="sm">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}

          {hasContact && (
            <div className="footer__column footer__column--contact">
              <h3 className="footer__heading">Contact</h3>
              <ul className="footer__list footer__list--stacked">
                {contact?.email && (
                  <li className="footer__list-item footer__contact-item">
                    <Mail size={16} aria-hidden="true" />
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </li>
                )}
                {contact?.phone && (
                  <li className="footer__list-item footer__contact-item">
                    <Phone size={16} aria-hidden="true" />
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </li>
                )}
                {contact?.address && (
                  <li className="footer__list-item footer__contact-item">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{contact.address}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {hasSocials && (
            <div className="footer__column">
              <h3 className="footer__heading">Follow</h3>
              <ul className="footer__list footer__list--socials">
                {socialLinks.map((social) => (
                  <li key={social.href} className="footer__list-item">
                    <a className="footer__social" href={social.href} aria-label={social.label}>
                      {social.icon || social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasNewsletter && newsletterConfig && (
            <div className="footer__newsletter">
              <h3 className="footer__heading">{newsletterConfig.title || "Newsletter"}</h3>
              {newsletterConfig.description && <p className="footer__description">{newsletterConfig.description}</p>}
              <form
                className="footer__newsletter-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const input = form.elements.namedItem("email") as HTMLInputElement | null;
                  if (input && newsletterConfig.onSubmit) {
                    newsletterConfig.onSubmit(input.value);
                  }
                }}
              >
                <label className="sr-only" htmlFor="footer-newsletter-email">
                  {newsletterConfig.title || "Email address"}
                </label>
                <input
                  id="footer-newsletter-email"
                  name="email"
                  type="email"
                  placeholder={newsletterConfig.placeholder || "Email address"}
                  className="footer__newsletter-input"
                />
                <Button type="submit" size="sm">
                  {newsletterConfig.buttonLabel || "Subscribe"}
                </Button>
              </form>
            </div>
          )}
        </div>

        {hasLegal && (
          <>
            <Divider variant="subtle" spacing="sm" />
            <div className="footer__bottom">
              {copyright && <p className="footer__copyright">{copyright}</p>}
              {legalLinks.length > 0 && (
                <nav className="footer__legal" aria-label="Legal links">
                  <ul className="footer__list footer__list--inline">
                    {legalLinks.map((link) => (
                      <li key={link.href} className="footer__list-item">
                        <Link href={link.href} variant="muted" size="sm">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
