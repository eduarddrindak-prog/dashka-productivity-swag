import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "./Button";
import { Link } from "./Link";
import "./Header.css";

export type HeaderNavItem = {
  label: string;
  href: string;
  current?: boolean;
};

export type HeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
};

export type HeaderProps = {
  logo?: ReactNode;
  items?: HeaderNavItem[];
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
  sticky?: boolean;
  className?: string;
  navLabel?: string;
};

export function Header({
  logo,
  items = [],
  primaryAction,
  secondaryAction,
  sticky = false,
  className = "",
  navLabel = "Main navigation",
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mobileMenuId = useId();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const renderAction = (action: HeaderAction | undefined, variant: "primary" | "secondary" | "ghost" | "success" | "danger" = "primary") => {
    if (!action) {
      return null;
    }

    const buttonProps = action.href
      ? { href: action.href }
      : { type: "button" as const, onClick: action.onClick };

    return (
      <Button key={action.label} variant={action.variant ?? variant} {...buttonProps}>
        {action.label}
      </Button>
    );
  };

  return (
    <header className={["header", sticky && "header--sticky", className].filter(Boolean).join(" ")}>
      <div className="container header__inner">
        <div className="header__brand">
          {logo ? (
            <div className="header__logo-wrap">{logo}</div>
          ) : (
            <a className="header__logo" href="/" aria-label="Home">
              Brand
            </a>
          )}
        </div>

        <nav
          className={["header__nav", isOpen && "header__nav--open"].filter(Boolean).join(" ")}
          aria-label={navLabel}
          id={mobileMenuId}
        >
          <ul className="header__nav-list">
            {items.map((item) => (
              <li key={item.href} className="header__nav-item">
                <Link
                  href={item.href}
                  className="header__link"
                  variant="muted"
                  aria-current={item.current ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          {secondaryAction && renderAction(secondaryAction, "secondary")}
          {primaryAction && renderAction(primaryAction, "primary")}

          <button
            type="button"
            className="header__menu-toggle"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls={mobileMenuId}
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
