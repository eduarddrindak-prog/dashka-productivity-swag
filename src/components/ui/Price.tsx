import "./Price.css";

type PriceProps = {
  amount: number | string;
  currency?: string;
  period?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};

export function Price({
  amount,
  currency = "$",
  period,
  size = "md",
  className = "",
  ariaLabel,
}: PriceProps) {
  const accessibleLabel =
    ariaLabel ??
    [
      currency,
      amount,
      period && `per ${period}`,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div
      className={[
        "price",
        `price--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={accessibleLabel}
    >
      <span
        className="price__currency"
        aria-hidden="true"
      >
        {currency}
      </span>

      <span
        className="price__amount"
        aria-hidden="true"
      >
        {amount}
      </span>

      {period && (
        <span
          className="price__period"
          aria-hidden="true"
        >
          /{period}
        </span>
      )}
    </div>
  );
}