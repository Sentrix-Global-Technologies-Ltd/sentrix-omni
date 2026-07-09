import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useRouteTasking } from "../hooks/useCoordinationActions";
import { TASKING_KIND_OPTIONS } from "./coordinationTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Route (open) a new HQ tasking (SuperAdmin). */
export default function RouteTaskingButton() {
  const route = useRouteTasking();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("general");
  const [ref, setRef] = useState("");

  return (
    <Can superAdminOnly>
      <ConfirmActionButton
        label="New tasking"
        triggerVariant="primary"
        title="Route a new tasking"
        confirmLabel="Route"
        successMessage="Tasking routed"
        onOpen={() => {
          setTitle("");
          setKind("general");
          setRef("");
        }}
        onConfirm={() =>
          title
            ? route.mutateAsync({ title, kind, ref: ref || undefined })
            : Promise.reject(new Error("A title is required."))
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Kind</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={fieldClass}>
              {TASKING_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Reference (optional)</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
