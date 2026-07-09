import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import WebhookTable from "../components/WebhookTable";
import CreateWebhookButton from "../components/CreateWebhookButton";
import { useWebhooks } from "../hooks/useWebhooks";

export default function WebhooksConsolePage() {
  const query = useWebhooks();

  return (
    <>
      <PageMeta title="Webhooks | Sentrix Console" description="Partner webhook endpoints" />
      <PageHeader
        title="Webhooks"
        breadcrumbs={[{ label: "Webhooks" }]}
        actions={<CreateWebhookButton />}
      />

      <WebhookTable
        webhooks={query.data?.data ?? []}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    </>
  );
}
