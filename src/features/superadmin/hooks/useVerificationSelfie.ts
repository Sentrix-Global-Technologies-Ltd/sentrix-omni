import { useEffect, useState } from "react";
import { fetchAuthenticatedImageUrl } from "../../../services/api/authenticatedImage";

/**
 * Loads the privately-stored selfie for a 'manual'-driver KYC submission
 * (GET platform/verifications/{id}/selfie) as a displayable blob URL. Only
 * call this when `has_selfie` is true — korapay/smile_id rows never have one
 * (see PlatformIdentityVerificationController::selfie()).
 */
export function useVerificationSelfie(verificationId: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!verificationId) {
      setUrl(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setStatus("loading");
    setUrl(null);

    fetchAuthenticatedImageUrl(`platform/verifications/${verificationId}/selfie`)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        objectUrl = blobUrl;
        setUrl(blobUrl);
        setStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [verificationId]);

  return { url, status };
}
