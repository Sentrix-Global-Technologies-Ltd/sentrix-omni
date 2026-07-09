import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useCreateAgency } from "../hooks/useCommandActions";
import { CATEGORY_OPTIONS } from "./commandTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function CreateAgencyButton() {
  const create = useCreateAgency();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("NG");
  const [hotline, setHotline] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const toggle = (value: string) =>
    setCategories((c) => (c.includes(value) ? c.filter((x) => x !== value) : [...c, value]));

  return (
    <Can superAdminOnly>
      <ConfirmActionButton
        label="New agency"
        triggerVariant="primary"
        title="Create agency"
        confirmLabel="Create"
        successMessage="Agency created"
        onOpen={() => {
          setCode("");
          setName("");
          setCountry("NG");
          setHotline("");
          setCategories([]);
        }}
        onConfirm={() =>
          create.mutateAsync({
            code,
            name,
            country,
            categories,
            hotline: hotline || undefined,
          })
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Hotline (optional)</label>
            <input value={hotline} onChange={(e) => setHotline(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={`rounded-full border px-3 py-1 text-theme-sm transition ${
                    categories.includes(o.value)
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
