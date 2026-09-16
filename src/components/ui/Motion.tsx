import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";

export type MotionPreset =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale"
  | "lift"
  | "slide"
  | "expand"
  | "collapse"
  | "none";

export type MotionSpeed = "fast" | "base" | "slow";
export type MotionDelay = "none" | "short" | "medium" | "long";

type MotionProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  preset?: MotionPreset;
  motion?: MotionPreset;
  speed?: MotionSpeed;
  delay?: MotionDelay | number;
  duration?: number;
  easing?: "standard" | "emphasized";
  className?: string;
  children?: ReactNode;
  reveal?: boolean;
threshold?: number;
};

const resolveSpeed = (speed: MotionSpeed | undefined): string => {
  switch (speed ?? "base") {
    case "fast":
      return "var(--duration-fast)";
    case "slow":
      return "var(--duration-slow)";
    case "base":
    default:
      return "var(--duration-base)";
  }
};

const resolveDelay = (delay: MotionDelay | number | undefined): string => {
  if (typeof delay === "number") {
    return `${delay}ms`;
  }

  switch (delay ?? "none") {
    case "short":
      return "var(--duration-fast)";
    case "medium":
      return "var(--duration-base)";
    case "long":
      return "var(--duration-slow)";
    case "none":
    default:
      return "0ms";
  }
};



export const Motion = forwardRef<HTMLElement, MotionProps>(function Motion(
  {
    as: Component = "div",
    preset,
    motion,
    speed,
    delay,
    duration,
    easing = "standard",
    className = "",
    style,
    children,
    reveal = false,
    threshold = 0.2,
    ...props
  },
  ref,
) {
  const resolvedPreset = motion ?? preset ?? "fade";
  const presetClass = resolvedPreset === "none" ? "" : `motion--${resolvedPreset}`;
    const [isVisible, setIsVisible] = useState(!reveal);
  const revealRef = useRef<HTMLElement | null>(null);
   
  useEffect(() => {
    if (!reveal || !revealRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: threshold ?? 0.2,
      },
    );

    observer.observe(revealRef.current);

    return () => observer.disconnect();
  }, [reveal, threshold]);

  const customStyle = {
    ...style,
    ["--motion-duration" as string]:
  duration !== undefined
    ? `${duration}ms`
    : reveal
      ? "var(--duration-reveal)"
      : resolveSpeed(speed),
    ["--motion-delay" as string]: resolveDelay(delay),
    ["--motion-easing" as string]:
      easing === "emphasized" ? "var(--ease-emphasized)" : "var(--ease-standard)",
  } as CSSProperties;

   const setRefs = (node: HTMLElement | null) => {
    revealRef.current = node;

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <Component
  ref={setRefs}
      className={[
  "motion",
  presetClass,
  reveal ? (isVisible ? "motion--visible" : "motion--hidden") : "",
  className,
]
  .filter(Boolean)
  .join(" ")}
      style={customStyle}
      {...props}
    >
      {children}
    </Component>
  );
});

type MotionGroupProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  stagger?: number;
  className?: string;
  children?: ReactNode;
};

export function MotionGroup({
  as: Component = "div",
  stagger = 120,
  className = "",
  children,
  ...props
}: MotionGroupProps) {
  const items = Children.toArray(children);

  return (
    <Component className={["motion-group", className].filter(Boolean).join(" ")} {...props}>
      {items.map((child, index) => {
        if (!isValidElement(child)) {
          return child;
        }

        const childStyle = (child.props as { style?: CSSProperties })?.style ?? {};

        return cloneElement(child as any, {
          style: {
            ...childStyle,
            ["--motion-delay" as string]: `${index * stagger}ms`,
          },
        });
      })}
    </Component>
  );
}
