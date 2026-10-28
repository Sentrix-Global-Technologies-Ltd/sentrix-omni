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

const thClass = "pb-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-400";
const tdClass = "py-3 pr-4 text-sm text-gray-700 dark:text-gray-300";

function certTone(status: string): Tone {
  if (status === "verified") return "success";
  if (status === "pending") return "warning";
  return "light";
}

/** Three filled/empty dots representing trainee / trained / expert. */
function ProficiencyDots({ level }: { level?: string | null }) {
  const levels = ["trainee", "trained", "expert"];
  const idx = level ? levels.indexOf(level) : -1;
  return (
    <span className="flex items-center gap-1.5">
      {levels.map((l, i) => (
        <span
          key={l}
          className={`h-2 w-2 rounded-full transition-colors ${
            i <= idx
              ? "bg-brand-500"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        />
      ))}
      {level && (
        <span className="ml-1 text-theme-xs text-gray-500 dark:text-gray-400">
          {titleCase(level)}
        </span>
      )}
    </span>
  );
}

/** Skills table section for a responder's detail page. */
export function SkillsSection({ responderId }: { responderId: string }) {
  const skills = useResponderSkills(responderId);
  const catalogue = useSkillCatalogue();
  const actions = useSkillActions(responderId);
  const [skillId, setSkillId] = useState("");
  const [proficiency, setProficiency] = useState("trained");
  const rows = skills.data?.data ?? [];
  const options = catalogue.data?.data ?? [];

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between gap-2">
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
                    <option key={s.id} value={s.id} className="dark:bg-gray-900">{s.name}</option>
                  ))}
                </select>
                <select value={proficiency} onChange={(e) => setProficiency(e.target.value)} className={fieldClass}>
                  {SKILL_PROFICIENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="dark:bg-gray-900">{o.label}</option>
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className={thClass}>Name</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Proficiency</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className={tdClass}>{s.name}</td>
                  <td className={`${tdClass} font-mono text-theme-xs text-gray-400`}>
                    {s.code ?? "—"}
                  </td>
                  <td className={tdClass}>
                    <ProficiencyDots level={s.proficiency} />
                  </td>
                  <td className="py-3 text-right">
                    <Can permission="responders.manage">
                      <ConfirmActionButton
                        label="Remove"
                        triggerSize="sm"
                        tone="danger"
                        title="Remove skill?"
                        description={`Remove "${s.name}" from this responder?`}
                        confirmLabel="Remove"
                        successMessage="Skill removed"
                        onConfirm={() => actions.remove.mutateAsync(s.id)}
                      />
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Certifications table section for a responder's detail page. */
export function CertificationsSection({ responderId }: { responderId: string }) {
  const certs = useResponderCertifications(responderId);
  const actions = useCertActions(responderId);
  const [name, setName] = useState("");
  const [authority, setAuthority] = useState("");
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const rows = certs.data?.data ?? [];

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Certifications</h3>
        <Can permission="responders.manage">
          <ConfirmActionButton
            label="Add"
            triggerSize="sm"
            title="Add certification"
            confirmLabel="Add"
            successMessage="Certification added"
            onOpen={() => { setName(""); setAuthority(""); setIssued(""); setExpires(""); }}
            onConfirm={() =>
              actions.add.mutateAsync({
                name,
                authority: authority || undefined,
                issued_at: issued || undefined,
                expires_at: expires || undefined,
              })
            }
          >
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={fieldClass} />
              <input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="Authority (optional)" className={fieldClass} />
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Issued date</label>
                <input type="date" value={issued} onChange={(e) => setIssued(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Expiry date</label>
                <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={fieldClass} />
              </div>
            </div>
          </ConfirmActionButton>
        </Can>
      </div>

      {rows.length === 0 ? (
        <p className="text-theme-sm text-gray-400">No certifications recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className={thClass}>Name</th>
                <th className={thClass}>Authority</th>
                <th className={thClass}>Issued</th>
                <th className={thClass}>Expires</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className={tdClass}>{c.name}</td>
                  <td className={`${tdClass} text-gray-400`}>{c.authority ?? "—"}</td>
                  <td className={`${tdClass} text-gray-400`}>{formatDateTime(c.issued_at)}</td>
                  <td className={`${tdClass} text-gray-400`}>{formatDateTime(c.expires_at)}</td>
                  <td className={tdClass}>
                    <StatusBadge tone={certTone(c.status)}>{titleCase(c.status)}</StatusBadge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.status !== "verified" && (
                        <Can permission="responders.manage">
                          <ConfirmActionButton
                            label="Verify"
                            triggerSize="sm"
                            triggerVariant="primary"
                            title="Verify certification?"
                            description={`Mark "${c.name}" as verified?`}
                            confirmLabel="Verify"
                            successMessage="Certification verified"
                            onConfirm={() => actions.verify.mutateAsync(c.id)}
                          />
                        </Can>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Duty shifts table section for a responder's detail page. */
export function ShiftsSection({ responderId }: { responderId: string }) {
  const shifts = useResponderShifts(responderId);
  const actions = useShiftActions(responderId);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const rows = shifts.data?.data ?? [];

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Duty Shifts</h3>
        <Can permission="schedules.manage">
          <ConfirmActionButton
            label="Schedule shift"
            triggerSize="sm"
            title="Schedule a shift"
            confirmLabel="Schedule"
            successMessage="Shift scheduled"
            onOpen={() => { setStart(""); setEnd(""); }}
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className={thClass}>Starts</th>
                <th className={thClass}>Ends</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className={tdClass}>{formatDateTime(s.starts_at)}</td>
                  <td className={tdClass}>{formatDateTime(s.ends_at)}</td>
                  <td className={tdClass}>
                    <StatusBadge tone="light">{titleCase(s.status)}</StatusBadge>
                  </td>
                  <td className="py-3 text-right">
                    <Can permission="schedules.manage">
                      <ConfirmActionButton
                        label="Remove"
                        triggerSize="sm"
                        tone="danger"
                        title="Remove shift?"
                        description="Remove this scheduled shift?"
                        confirmLabel="Remove"
                        successMessage="Shift removed"
                        onConfirm={() => actions.remove.mutateAsync(s.id)}
                      />
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Skills + certifications + shifts for a responder's detail page. */
export default function ResponderProfilePanels({ responderId }: { responderId: string }) {
  return (
    <div className="space-y-6">
      <SkillsSection responderId={responderId} />
      <CertificationsSection responderId={responderId} />
      <ShiftsSection responderId={responderId} />
    </div>
  );
}
