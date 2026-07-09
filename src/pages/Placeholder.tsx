import PageMeta from "../components/common/PageMeta";
import PageHeader from "../components/shared/PageHeader";
import ComingSoon from "../components/shared/ComingSoon";

/**
 * Generic shell page for a navigation destination whose feature is not built
 * yet. Composes the shared PageHeader + ComingSoon. Used by route definitions so
 * the navigation is fully traversable without any operational screens existing.
 */
export default function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageMeta title={`${title} | Sentrix Console`} description={`${title} — Sentrix Console`} />
      <PageHeader title={title} breadcrumbs={[{ label: title }]} />
      <ComingSoon title={title} />
    </>
  );
}
