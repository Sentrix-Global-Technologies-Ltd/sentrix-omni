import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthz } from "../../../hooks/useAuthz";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useSiteBridgeActions } from "../hooks/useSiteBridgeActions";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import type { CameraBridge } from "../api/site-bridges.types";

type BridgeAction = "rotate" | "activate" | "suspend" | "revoke";

interface Props {
  bridge: CameraBridge;
}

/**
 * Three-dot row menu for a single Site Bridge.
 * Mirrors the hw-row-menu pattern from DeviceActionsMenu.
 * The dropdown is portal-rendered at body level to escape CSS transform ancestors.
 */
export default function BridgeRowMenu({ bridge }: Props) {
  const { isAllowed } = useAuthz();
  const toast = useToast();
  const a = useSiteBridgeActions(bridge.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dialog state
  const [pendingAction, setPendingAction] = useState<BridgeAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const canManage = isAllowed({ anyPermission: ["bridges.manage"] });
  if (!canManage) return null;

  // Visibility per status
  const notRevoked  = bridge.status !== "revoked";
  const isActive    = bridge.status === "active";
  const canActivate = bridge.status !== "active" && notRevoked;
  const hasActions  = notRevoked; // at minimum Rotate + Revoke are always visible if not revoked

  if (!hasActions) return null;

  // ── Dropdown positioning (portal, escapes CSS transform ancestors) ─────────

  useEffect(() => {
    if (!menuOpen) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const right = Math.max(4, window.innerWidth - rect.right);
      // Flip above the button when there isn't enough room below
      const estimatedHeight = 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < estimatedHeight && rect.top > spaceBelow;
      setDropdownStyle({
        position: "fixed",
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        right,
        minWidth: 160,
        zIndex: 100010,
      });
    }
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!btnRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // ── Pick + confirm ─────────────────────────────────────────────────────────

  const pick = (action: BridgeAction) => {
    setMenuOpen(false);
    setPendingAction(action);
  };

  const closeDialog = () => { if (!submitting) setPendingAction(null); };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      if (pendingAction === "rotate") {
        const res = await a.rotateKey.mutateAsync();
        setPendingAction(null);
        setSecret(res.data.bridge_key);
      } else if (pendingAction === "activate") {
        await a.activate.mutateAsync();
        toast.success("Bridge activated");
        setPendingAction(null);
      } else if (pendingAction === "suspend") {
        await a.suspend.mutateAsync();
        toast.success("Bridge suspended");
        setPendingAction(null);
      } else if (pendingAction === "revoke") {
        await a.revoke.mutateAsync();
        toast.success("Bridge revoked");
        setPendingAction(null);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Dialog config per action ───────────────────────────────────────────────

  const cfg: Record<BridgeAction, { title: string; description: string; confirmLabel: string; tone: "primary" | "danger" }> = {
    rotate: {
      title: "Rotate bridge key?",
      description: `The current key for "${bridge.label}" stops working immediately. You'll receive a new one to copy.`,
      confirmLabel: "Rotate",
      tone: "danger",
    },
    activate: {
      title: "Activate bridge?",
      description: `Activate "${bridge.label}". It will accept ingest authenticated with its key.`,
      confirmLabel: "Activate",
      tone: "primary",
    },
    suspend: {
      title: "Suspend bridge?",
      description: `Suspend "${bridge.label}". Ingest will be rejected until re-activated.`,
      confirmLabel: "Suspend",
      tone: "primary",
    },
    revoke: {
      title: "Revoke bridge?",
      description: `Permanently revoke "${bridge.label}". Its key stops working and this cannot be undone.`,
      confirmLabel: "Revoke",
      tone: "danger",
    },
  };

  const dropdown = (
    <div ref={dropdownRef} className="hw-row-menu-dropdown" role="menu" style={dropdownStyle}>
      {notRevoked && (
        <button type="button" className="hw-row-menu-item" onClick={() => pick("rotate")}>
          Rotate key
        </button>
      )}
      {canActivate && (
        <button type="button" className="hw-row-menu-item" onClick={() => pick("activate")}>
          Activate
        </button>
      )}
      {isActive && (
        <button type="button" className="hw-row-menu-item" onClick={() => pick("suspend")}>
          Suspend
        </button>
      )}
      {notRevoked && (
        <>
          <div className="hw-row-menu-divider" />
          <button type="button" className="hw-row-menu-item hw-row-menu-item--danger" onClick={() => pick("revoke")}>
            Revoke
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="hw-row-menu-btn"
        aria-label={`Actions for ${bridge.label}`}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5"  r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {menuOpen && createPortal(dropdown, document.body)}

      {pendingAction && (
        <ConfirmDialog
          open
          onClose={closeDialog}
          title={cfg[pendingAction].title}
          description={cfg[pendingAction].description}
          confirmLabel={cfg[pendingAction].confirmLabel}
          tone={cfg[pendingAction].tone}
          loading={submitting}
          onConfirm={handleConfirm}
        />
      )}

      <SecretRevealDialog
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="New bridge key"
        secret={secret ?? ""}
        description={`Store the rotated key for "${bridge.label}" now.`}
      />
    </>
  );
}
