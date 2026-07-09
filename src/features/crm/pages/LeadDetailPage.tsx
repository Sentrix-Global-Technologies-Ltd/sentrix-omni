import { useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useLead } from "../hooks/useLead";
import { useLeadActions } from "../hooks/useLeadActions";
import { STAGE_OPTIONS, formatDateTime, leadStageTone, titleCase } from "../components/leadTone";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function LeadDetailPage() {
  const { id = "" } = useParams();
  const query = useLead(id);
  const lead = query.data?.data;
  const actions = useLeadActions(id);
  const [stage, setStage] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("NGN");
  const [quoteNote, setQuoteNote] = useState("");

  const breadcrumbs = [
    { label: "SuperAdmin", to: "/superadmin" },
    { label: "Leads", to: "/superadmin/leads" },
    { label: lead?.name ?? "Detail" },
  ];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Lead" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }

  if (query.error || !lead) {
    return (
      <>
        <PageHeader title="Lead" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageMeta title={`${lead.name} | Sentrix Console`} description="Lead detail" />
      <PageHeader
        title={lead.name}
        breadcrumbs={breadcrumbs}
        actions={<StatusBadge tone={leadStageTone[lead.stage]}>{titleCase(lead.stage)}</StatusBadge>}
      />

      <Can superAdminOnly>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <ConfirmActionButton
            label="Change stage"
            title="Change lead stage"
            description="Move this lead to a different pipeline stage."
            confirmLabel="Update stage"
            successMessage="Lead stage updated"
            onOpen={() => setStage(lead.stage)}
            onConfirm={() => actions.changeStage.mutateAsync(stage)}
          >
            <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectClass}>
              {STAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </ConfirmActionButton>

          <ConfirmActionButton
            label="Attach quote"
            title="Attach a quote"
            description="Record a quote for this lead."
            confirmLabel="Save quote"
            successMessage="Quote attached"
            onOpen={() => {
              setQuoteAmount("");
              setQuoteCurrency("NGN");
              setQuoteNote("");
            }}
            onConfirm={() =>
              actions.attachQuote.mutateAsync({
                amount: quoteAmount ? Number(quoteAmount) : null,
                currency: quoteCurrency,
                note: quoteNote || null,
              })
            }
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Amount</label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className={selectClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Currency</label>
                <input
                  value={quoteCurrency}
                  onChange={(e) => setQuoteCurrency(e.target.value)}
                  className={selectClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Note (optional)</label>
                <input
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  className={selectClass}
                />
              </div>
            </div>
          </ConfirmActionButton>

          {!lead.converted_organization_id && (
            <ConfirmActionButton
              label="Convert to organization"
              triggerVariant="primary"
              title="Convert lead?"
              description="Create an organization from this lead and mark it won."
              confirmLabel="Convert"
              successMessage="Lead converted"
              onConfirm={() => actions.convert.mutateAsync()}
            />
          )}
        </div>
      </Can>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Lead</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Client type</dt>
                <dd className="text-gray-700 dark:text-gray-300">{titleCase(lead.client_type)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Region</dt>
                <dd className="text-gray-700 dark:text-gray-300">{lead.region ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Source</dt>
                <dd className="text-gray-700 dark:text-gray-300">{lead.source ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Converted org</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {lead.converted_organization_id ? lead.converted_organization_id.slice(0, 8) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Created</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(lead.created_at)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Contact</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Name</dt>
                <dd className="text-gray-700 dark:text-gray-300">{lead.contact_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Email</dt>
                <dd className="text-gray-700 dark:text-gray-300">{lead.contact_email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Phone</dt>
                <dd className="text-gray-700 dark:text-gray-300">{lead.contact_phone ?? "—"}</dd>
              </div>
            </dl>
            {lead.notes && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-theme-xs uppercase tracking-wide text-gray-400">Notes</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
