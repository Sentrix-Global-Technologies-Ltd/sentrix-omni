import type { ReactNode } from "react";
import Badge from "./Badge";
import type { Tone } from "../tone";

/**
 * Status pill built on the template Badge. Generic by design: the caller maps a
 * domain status to a `tone` (see feature tone maps, e.g. incidentStatusTone).
 */
export default function StatusBadge({
  tone = "light",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <Badge variant="light" color={tone}>
      {children}
    </Badge>
  );
}
