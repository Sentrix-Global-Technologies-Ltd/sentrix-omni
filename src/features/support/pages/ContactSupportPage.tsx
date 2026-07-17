import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Pagination from "../../../components/ui/pagination/Pagination";
import ContactSupportButton from "../components/ContactSupportButton";
import SupportTicketTable from "../components/SupportTicketTable";
import { useSupportTickets } from "../hooks/useSupportTickets";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/**
 * Org-side "raise an issue" surface: any org member can message Sentrix
 * support directly (with an optional screenshot) and track their own ticket
 * history. Self-only by design — see SupportTicketController's docblock.
 */
export default function ContactSupportPage() {
  const [page, setPage] = useState(1);
  const tickets = useSupportTickets({ page });
  const meta = tickets.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Support | Sentrix Console" description="Contact Sentrix support and track your tickets" />
      <PageHeader
        title="Support"
        description="Raise an issue with Sentrix and track your ticket history."
        breadcrumbs={[{ label: "Support" }]}
        actions={<ContactSupportButton />}
      />

      <SupportTicketTable
        tickets={tickets.data?.data ?? []}
        isLoading={tickets.isLoading}
        error={tickets.error}
        onRetry={() => void tickets.refetch()}
      />

      {meta && (
        <Pagination
          currentPage={meta.current_page ?? 1}
          lastPage={meta.last_page ?? 1}
          total={meta.total}
          from={meta.from}
          to={meta.to}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
