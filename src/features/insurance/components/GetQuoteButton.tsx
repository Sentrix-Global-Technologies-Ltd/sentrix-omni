import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useInsuranceActions } from "../hooks/useInsurance";
import { humanize, money } from "./insuranceTone";

/** Request a risk-priced premium quote (gated insurance.quote). Shows the result inline. */
export default function GetQuoteButton() {
  const { quote } = useInsuranceActions();
  const result = quote.data?.data;

  return (
    <Can permission="insurance.quote">
      <div className="space-y-3">
        <ConfirmActionButton
          label="Get quote"
          triggerVariant="outline"
          title="Get a risk-priced premium quote?"
          description="Sentrix will price an annual premium from your current risk profile."
          confirmLabel="Get quote"
          successMessage="Quote generated"
          onConfirm={() => quote.mutateAsync({})}
        />
        {result && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="text-theme-xs text-gray-400">Premium</dt>
              <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                {money(result.premium_cents, result.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-400">Baseline premium</dt>
              <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                {money(result.baseline_premium_cents, result.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-400">Sentrix saving</dt>
              <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                {money(result.sentrix_saving_cents, result.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-400">Score / band</dt>
              <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                {result.score} · {humanize(result.band)}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </Can>
  );
}
