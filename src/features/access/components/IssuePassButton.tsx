import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useIssuePass } from "../hooks/useAccess";
import { PASS_TYPE_OPTIONS } from "./accessTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Issue a visitor pass (gated passes.issue). */
export default function IssuePassButton() {
  const issue = useIssuePass();
  const [name, setName] = useState("");
  const [type, setType] = useState("single");
  const [until, setUntil] = useState("");

  return (
    <Can permission="passes.issue">
      <ConfirmActionButton
        label="Issue pass"
        triggerVariant="primary"
        title="Issue a visitor pass"
        description="Create a gate pass for a visitor."
        confirmLabel="Issue"
        successMessage="Pass issued"
        onOpen={() => {
          setName("");
          setType("single");
          setUntil("");
        }}
        onConfirm={() =>
          issue.mutateAsync({ visitor_name: name, type, valid_until: until || undefined })
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Visitor name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
              {PASS_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Valid until (optional)</label>
            <input
              type="datetime-local"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
