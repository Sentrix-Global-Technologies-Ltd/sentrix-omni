import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useLogGate, useScanGate } from "../hooks/useAccess";
import { GATE_DIRECTION_OPTIONS } from "./accessTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Scan a visitor pass code at the gate (gated gate.scan). */
export function ScanGateButton() {
  const scan = useScanGate();
  const [code, setCode] = useState("");
  const [gate, setGate] = useState("");
  const [direction, setDirection] = useState("in");

  return (
    <Can permission="gate.scan">
      <ConfirmActionButton
        label="Scan code"
        triggerVariant="primary"
        title="Scan a pass code"
        description="Verify a visitor pass code at the gate and record the result."
        confirmLabel="Scan"
        successMessage="Code scanned"
        onOpen={() => {
          setCode("");
          setGate("");
          setDirection("in");
        }}
        onConfirm={() =>
          scan.mutateAsync({ code: code.trim(), gate: gate.trim() || undefined, direction })
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Pass code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Gate (optional)</label>
            <input value={gate} onChange={(e) => setGate(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Direction</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className={fieldClass}>
              {GATE_DIRECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}

/** Log a gate event manually, without a pass scan (gated gate.log). */
export function LogGateEntryButton() {
  const log = useLogGate();
  const [gate, setGate] = useState("");
  const [direction, setDirection] = useState("in");
  const [result, setResult] = useState("granted");
  const [visitorName, setVisitorName] = useState("");

  return (
    <Can permission="gate.log">
      <ConfirmActionButton
        label="Log manual entry"
        triggerVariant="outline"
        title="Log a gate entry manually"
        description="Record a gate event without scanning a pass (e.g. a manual override)."
        confirmLabel="Log entry"
        successMessage="Gate entry logged"
        onOpen={() => {
          setGate("");
          setDirection("in");
          setResult("granted");
          setVisitorName("");
        }}
        onConfirm={() =>
          log.mutateAsync({
            gate: gate.trim() || undefined,
            direction,
            result,
            visitor_name: visitorName.trim() || undefined,
          })
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Visitor name (optional)</label>
            <input
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Gate (optional)</label>
            <input value={gate} onChange={(e) => setGate(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Direction</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className={fieldClass}>
              {GATE_DIRECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Result</label>
            <select value={result} onChange={(e) => setResult(e.target.value)} className={fieldClass}>
              <option value="granted" className="dark:bg-gray-900">Granted</option>
              <option value="denied" className="dark:bg-gray-900">Denied</option>
            </select>
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
