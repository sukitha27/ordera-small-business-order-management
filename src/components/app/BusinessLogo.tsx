import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "business-assets";
// 1 hour expiry — long enough to print, short enough that signed URLs don't
// leak. We refetch on every component mount which is fine for current usage.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

interface Props {
  /** Path in the storage bucket — typically business.logo_url */
  path: string | null | undefined;
  /** Business name as fallback alt text */
  alt?: string;
  className?: string;
  /** Size variant — controls intrinsic dimensions */
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-auto max-w-[120px]",
  md: "h-10 w-auto max-w-[160px]",
  lg: "h-14 w-auto max-w-[220px]",
  xl: "h-20 w-auto max-w-[300px]",
};

/**
 * Renders a business logo from a private storage path. Generates a signed
 * URL on mount. If `path` is empty the component returns null so the parent
 * can fall back to a text-only header.
 */
export function BusinessLogo({ path, alt, className, size = "md" }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }

    (async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
      if (cancelled) return;
      if (error || !data) {
        setErrored(true);
        return;
      }
      setUrl(data.signedUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path || errored || !url) return null;

  return (
    <img
      src={url}
      alt={alt || "Business logo"}
      className={`${SIZE_CLASSES[size]} object-contain ${className ?? ""}`}
      onError={() => setErrored(true)}
    />
  );
}