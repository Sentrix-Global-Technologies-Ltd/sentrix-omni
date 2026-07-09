import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import type { Tone } from "../../../components/ui/tone";
import { formatDateTime, titleCase } from "../../../lib/format";
import {
  useCertActions,
  useResponderCertifications,
  useResponderShifts,
  useResponderSkills,
  useShiftActions,
  useSkillActions,
  useSkillCatalogue,
} from "../hooks/useResponderProfile";
import { SKILL_PROFICIENCY_OPTIONS } from "../api/profile.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";
const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function certTone(status: string): Tone {
  if (status === "verified") return "success";
  if (status === "pending") return "warning";
  return "light";
}

function SkillsPanel({ responderId }: { responderId: string }) {
  const skills = useResponderSkills(responderId);
  const catalogue = useSkillCatalogue();
  const actions = useSkillActions(responderId);
  const [skillId, setSkillId] = useState("");
  const [proficiency, setProficiency] = useState("trained");
  const rows = skills.data?.data ?? [];
  const options = catalogue.data?.data ?? [];

  return (
    <div className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Skills</h3>
        <Can permission="responders.manage">
          <ConfirmActionButton
            label="Add skill"
            triggerSize="sm"
            title="Attach a skill"
            confirmLabel="Attach"
            successMessage="Skill attached"
            disabled={options.length === 0}
            onOpen={() => {
              setSkillId(options[0]?.id ?? "");
              setProficiency("trained");
            }}
            onConfirm={() => actions.attach.mutateAsync({ skill_id: skillId, proficiency })}
          >
            {options.length > 0 ? (
              <div className="space-y-3">
                <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className={fieldClass}>
                  {options.map((s) => (
                    <option key={s.id} value={s.id} className="dark:bg-gray-900">
                      {s.name}
                    </option>
                  ))}
                </select>
                <select value={proficiency} onChange={(e) => setProficiency(e.target.value)} className={fieldClass}>
                  {SKILL_PROFICIENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="dark:bg-gray-900">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-theme-sm text-gray-500">No skills in the catalogue yet.</p>
            )}
          </ConfirmActionButton>
        </Can>
      </div>
      {rows.length === 0 ? (
        <p className="text-theme-sm text-gray-400">No skills attached.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {s.name}
                {s.proficiency && <span className="ml-2 text-theme-xs text-gray-400">{titleCase(s.proficiency)}</span>}
              </span>
              <Can permission="responders.manage">
                <ConfirmActionButton
                  label="Remove"
                  triggerSize="sm"
                  tone="danger"
                  title="Remove skill?"
                  confirmLabel="Remove"
                  successMessage="Skill removed"
                  onConfirm={() => actions.remove.mutateAsync(s.id)}
                />
              </Can>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CertificationsPanel({ responderId }: { responderId: string }) {
  const certs = useResponderCertifications(responderId);
  const actions = useCertActions(responderId);
  const [name, setName] = useState("");
  const [authority, setAuthority] = useState("");
  const [expires, setExpires] = useState("");
  const rows = certs.data?.data ?? [];

  return (
    <div className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Certifications</h3>
        <Can permission="responders.manage">
          <ConfirmActionButton
            label="Add"
            triggerSize="sm"
            title="Add certification"
            confirmLabel="Add"
            successMessage="Certification added"
            onOpen={() => {
              setName("");
              setAuthority("");
              setExpires("");
            }}
            onConfirm={() =>
              actions.add.mutateAsync({ name, authority: authority || undefined, expires_at: expires || undefined })
            }
          >
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={fieldClass} />
              <input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="Authority (optional)" className={fieldClass} />
              <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={fieldClass} />
            </div>
          </ConfirmActionButton>
        </Can>
      </div>
      {rows.length === 0 ? (
        <p className="text-theme-sm text-gray-400">No certifications.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
              <div className="min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-200">{c.name}</p>
                <p className="mt-0.5 text-theme-xs text-gray-400">
                  {c.authority ?? "—"}
                  {c.expires_at ? ` · expires ${formatDateTime(c.expires_at)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={certTone(c.status)}>{titleCase(c.status)}</StatusBadge>
                {c.status !== "verified" && (
                  <Can permission="responders.manage">
                    <ConfirmActionButton
                      label="Verify"
                      triggerSize="sm"
                      triggerVariant="primary"
                      title="Verify certification?"
                      confirmLabel="Verify"
                      successMessage="Certification verified"
                      onConfirm={() => actions.verify.mutateAsync(c.id)}
                    />
                  </Can>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShiftsPanel({ responderId }: { responderId: string }) {
  const shifts = useResponderShifts(responderId);
  const actions = useShiftActions(responderId);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const rows = shifts.data?.data ?? [];

  return (
    <div className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Duty shifts</h3>
        <Can permission="schedules.manage">
          <ConfirmActionButton
            label="Schedule"
            triggerSize="sm"
            title="Schedule a shift"
            confirmLabel="Schedule"
            successMessage="Shift scheduled"
            onOpen={() => {
              setStart("");
              setEnd("");
            }}
            onConfirm={() => actions.schedule.mutateAsync({ starts_at: start, ends_at: end })}
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Starts</label>
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Ends</label>
                <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={fieldClass} />
              </div>
            </div>
          </ConfirmActionButton>
        </Can>
      </div>
      {rows.length === 0 ? (
        <p className="text-theme-sm text-gray-400">No shifts scheduled.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {formatDateTime(s.starts_at)} → {formatDateTime(s.ends_at)}
              </span>
              <div className="flex items-center gap-2">
                <StatusBadge tone="light">{titleCase(s.status)}</StatusBadge>
                <Can permission="schedules.manage">
                  <ConfirmActionButton
                    label="Remove"
                    triggerSize="sm"
                    tone="danger"
                    title="Remove shift?"
                    confirmLabel="Remove"
                    successMessage="Shift removed"
                    onConfirm={() => actions.remove.mutateAsync(s.id)}
                  />
                </Can>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Skills + certifications + shifts panels for a responder's detail page. */
export default function ResponderProfilePanels({ responderId }: { responderId: string }) {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 lg:col-span-4">
        <SkillsPanel responderId={responderId} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <CertificationsPanel responderId={responderId} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <ShiftsPanel responderId={responderId} />
      </div>
    </div>
  );
}
