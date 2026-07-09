import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useOrgMembersForResponderPicker, useRegisterResponder } from "../hooks/useRegisterResponder";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * Org roles eligible to become a dispatchable Responder record. Deliberately
 * excludes:
 *  - OrganizationAdmin — account/business oversight (members, roles, billing,
 *    webhooks), not field operations. Never part of the roster it oversees.
 *  - User — the served/monitored party (raises their own trips/emergencies),
 *    not staff. Registering a User would mix "who's protected" with "who
 *    protects," which this system keeps deliberately separate.
 * Supervisor is included on purpose — a working supervisor who also covers
 * assignments personally is a normal real-world pattern, and Supervisor is
 * the top of the actual day-to-day operational chain (Admin stays hands-off).
 */
const ELIGIBLE_ROLES = ["Supervisor", "Dispatcher", "Responder"];

/**
 * Turns an existing organization member into a dispatchable Responder record.
 * Being assigned the "Responder" org role only grants permissions — it has no
 * effect on this list or on the dispatch picker, which both read from the
 * separate `responders` table. This is the only way to populate either one.
 */
export default function RegisterResponderButton() {
  const members = useOrgMembersForResponderPicker();
  const register = useRegisterResponder();
  const [userId, setUserId] = useState("");

  const options = (members.data?.data ?? []).filter((m) =>
    m.roles.some((r) => ELIGIBLE_ROLES.includes(r)),
  );

  return (
    <Can permission="responders.manage">
      <ConfirmActionButton
        label="Register responder"
        triggerVariant="primary"
        title="Register a responder"
        description="Make an existing organization member dispatchable — this creates their responder profile (status, skills, certifications) so they can be assigned to incidents."
        confirmLabel="Register"
        successMessage="Responder registered"
        disabled={members.isLoading || options.length === 0}
        onOpen={() => setUserId("")}
        onConfirm={() => register.mutateAsync({ user_id: userId })}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Organization member</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={fieldClass}
            >
              <option value="" className="dark:bg-gray-900">
                {members.isLoading ? "Loading members…" : "Select a member"}
              </option>
              {options.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-gray-900">
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-theme-xs text-gray-400">
              Only Supervisor, Dispatcher, and Responder-role members are shown — organization
              admins and Users aren't field-operational roles. Not seeing someone? They need to
              be invited, accept, and hold one of those roles first.
            </p>
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
