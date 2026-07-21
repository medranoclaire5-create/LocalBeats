import { useState } from "react";

export interface StarRatingProps {
  rating: number; // 1-5
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeClasses: Record<string, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const filled = displayRating >= i;
    const halfFilled = !filled && displayRating >= i - 0.5;

    let starClass = `${sizeClasses[size]} `;
    if (filled) {
      starClass += "text-yellow-400";
    } else if (halfFilled) {
      starClass += "text-yellow-400";
    } else {
      starClass += "text-gray-300";
    }

    if (interactive) {
      starClass += " cursor-pointer transition-transform hover:scale-110";
    }

    const commonSvgProps = interactive
      ? {
          onMouseEnter: () => setHoverRating(i),
          onMouseLeave: () => setHoverRating(0),
          onClick: () => onChange?.(i),
        }
      : {};

    if (filled) {
      stars.push(
        <svg
          key={i}
          className={starClass}
          fill="currentColor"
          viewBox="0 0 20 20"
          {...commonSvgProps}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>,
      );
    } else if (halfFilled) {
      stars.push(
        <svg
          key={i}
          className={starClass}
          viewBox="0 0 20 20"
          {...commonSvgProps}
        >
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-${i})`}
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>,
      );
    } else {
      stars.push(
        <svg
          key={i}
          className={starClass}
          fill="currentColor"
          viewBox="0 0 20 20"
          {...commonSvgProps}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>,
      );
    }
  }

  return (
    <span
      className="inline-flex items-center gap-0.5"
      onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
    >
      {stars}
    </span>
  );
}
