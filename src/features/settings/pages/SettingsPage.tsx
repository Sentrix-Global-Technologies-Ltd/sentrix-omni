import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import Badge from "../../../components/ui/badge/Badge";
import EmptyState from "../../../components/ui/state/EmptyState";
import MembersCard from "../components/MembersCard";
import InvitationsCard from "../components/InvitationsCard";
import OrgDangerZone from "../components/OrgDangerZone";
import { useAuth } from "../../../context/AuthContext";
import { useOrganizationDetails } from "../hooks/useOrganizationDetails";
import { useOrganizationActions } from "../hooks/useSettingsActions";
import { formatDateTime } from "../../../lib/format";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function SettingsPage() {
  const { principal } = useAuth();
  const orgQuery = useOrganizationDetails();
  const org = orgQuery.data?.data;
  const orgActions = useOrganizationActions();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [region, setRegion] = useState("");

  return (
    <>
      <PageMeta title="Settings | Sentrix Console" description="Profile & organization settings" />
      {/*
        No "New organization" action here anymore: tenant provisioning is now
        a platform-staff action (organizations.provision — OnboardingManager
        or SuperAdmin), not something any org member can self-serve. See
        StoreOrganizationRequest for the backend gate. Platform staff create
        tenants via the CRM lead-conversion flow, or organizations.store
        directly as an API/admin-tool action — neither belongs on this
        org-scoped Settings page.
      */}
      <PageHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Profile */}
        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Your profile</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Name</dt>
                <dd className="text-gray-700 dark:text-gray-300">{principal?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Email</dt>
                <dd className="text-gray-700 dark:text-gray-300">{principal?.email ?? "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-gray-400">Roles</dt>
                <dd className="flex flex-wrap justify-end gap-1">
                  {principal && principal.roles.length > 0 ? (
                    principal.roles.map((r) => (
                      <Badge key={r} variant="light" color="primary">{r}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Organization */}
        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Organization</h3>
              {org && (
                <Can permission="organization.update">
                  <ConfirmActionButton
                    label="Edit"
                    title="Edit organization"
                    description="Update the organization name, slug, and region."
                    confirmLabel="Save changes"
                    successMessage="Organization updated"
                    onOpen={() => {
                      setName(org.name ?? "");
                      setSlug(org.slug ?? "");
                      setRegion(org.region ?? "");
                    }}
                    onConfirm={() =>
                      orgActions.update.mutateAsync({
                        name: name || undefined,
                        slug: slug || undefined,
                        // Sent as null (not omitted) when cleared, so the
                        // backend actually unlinks the command — omitting the
                        // key entirely would leave the previous region as-is.
                        region: region.trim() === "" ? null : region.trim(),
                      })
                    }
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-theme-xs text-gray-400">Slug</label>
                        <input
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="my-org"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-theme-xs text-gray-400">Region</label>
                        <input
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="e.g. Lagos"
                          className={fieldClass}
                        />
                        <p className="mt-1 text-theme-xs text-gray-400">
                          Matched to a command area for agency oversight — leave blank if not applicable.
                        </p>
                      </div>
                    </div>
                  </ConfirmActionButton>
                </Can>
              )}
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Name</dt>
                <dd className="text-gray-700 dark:text-gray-300">{org?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Slug</dt>
                <dd className="text-gray-700 dark:text-gray-300">{org?.slug ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Region</dt>
                <dd className="text-gray-700 dark:text-gray-300">{org?.region ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Command oversight</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {org?.command_id ? (
                    <Badge variant="light" color="success">Linked</Badge>
                  ) : (
                    <Badge variant="light" color="light">Unlinked</Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Members</dt>
                <dd className="text-gray-700 dark:text-gray-300">{org?.members_count ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Created</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(org?.created_at)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Members (permission-gated) */}
        <div className="col-span-12">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Members</h3>
          <Can
            permission="members.view"
            fallback={
              <div className={card}>
                <EmptyState
                  title="Members hidden"
                  description="You don't have permission to view the member list."
                />
              </div>
            }
          >
            <MembersCard />
          </Can>
        </div>

        {/* Invitations (permission-gated) */}
        <Can permission="members.view">
          <div className="col-span-12">
            <div className={card}>
              <InvitationsCard />
            </div>
          </div>
        </Can>

        {/* Owner-only danger zone */}
        {org && (
          <div className="col-span-12">
            <OrgDangerZone org={org} />
          </div>
        )}
      </div>
    </>
  );
}
