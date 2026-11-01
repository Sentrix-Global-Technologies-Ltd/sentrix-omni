import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import { useProfileActions } from "../../hooks/useProfileActions";
import { useToast } from "../shared/toast";
import { ApiError, ValidationError } from "../../services/api/errors";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

// Mirror the backend's UpdateProfileRequest regexes exactly.
const POSTAL_PATTERN = /^[A-Za-z0-9\-\s]{1,20}$/;
const TAX_ID_PATTERN = /^[A-Za-z0-9-]{1,50}$/;

export default function UserAddressCard() {
  const { principal } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const { update } = useProfileActions();
  const toast = useToast();

  const [country, setCountry] = useState("");
  const [cityState, setCityState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [countryError, setCountryError] = useState<string | null>(null);
  const [cityStateError, setCityStateError] = useState<string | null>(null);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [taxIdError, setTaxIdError] = useState<string | null>(null);

  function handleOpen() {
    setCountry(principal?.country ?? "");
    setCityState(principal?.city_state ?? "");
    setPostalCode(principal?.postal_code ?? "");
    setTaxId(principal?.tax_id ?? "");
    setCountryError(null);
    setCityStateError(null);
    setPostalCodeError(null);
    setTaxIdError(null);
    openModal();
  }

  // Every field here is optional — errors only fire when something invalid
  // was actually typed, never on a blank (nullable) field.
  function validate(): boolean {
    let ok = true;

    if (country.length > 100) {
      setCountryError("Country must be 100 characters or fewer.");
      ok = false;
    } else {
      setCountryError(null);
    }

    if (cityState.length > 150) {
      setCityStateError("City/State must be 150 characters or fewer.");
      ok = false;
    } else {
      setCityStateError(null);
    }

    if (postalCode.trim().length > 0 && !POSTAL_PATTERN.test(postalCode.trim())) {
      setPostalCodeError("Use letters, numbers, spaces, or hyphens only (max 20 characters).");
      ok = false;
    } else {
      setPostalCodeError(null);
    }

    if (taxId.trim().length > 0 && !TAX_ID_PATTERN.test(taxId.trim())) {
      setTaxIdError("Use letters, numbers, or hyphens only (max 50 characters).");
      ok = false;
    } else {
      setTaxIdError(null);
    }

    return ok;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      await update.mutateAsync({
        country: country.trim() === "" ? null : country.trim(),
        city_state: cityState.trim() === "" ? null : cityState.trim(),
        postal_code: postalCode.trim() === "" ? null : postalCode.trim(),
        tax_id: taxId.trim() === "" ? null : taxId.trim(),
      });
      toast.success("Address updated");
      closeModal();
    } catch (err) {
      if (err instanceof ValidationError) {
        if (err.errors.country) setCountryError(err.errors.country[0]);
        if (err.errors.city_state) setCityStateError(err.errors.city_state[0]);
        if (err.errors.postal_code) setPostalCodeError(err.errors.postal_code[0]);
        if (err.errors.tax_id) setTaxIdError(err.errors.tax_id[0]);
      }
      toast.error(err instanceof ApiError ? err.message : "Could not update address. Please try again.");
    }
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Country
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {principal?.country ?? "—"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  City/State
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {principal?.city_state ?? "—"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Postal Code
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {principal?.postal_code ?? "—"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  TAX ID
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {principal?.tax_id ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpen}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Address
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <div className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Country</Label>
                  <Input
                    type="text"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (countryError) setCountryError(null);
                    }}
                    error={Boolean(countryError)}
                    hint={countryError ?? undefined}
                  />
                </div>

                <div>
                  <Label>City/State</Label>
                  <Input
                    type="text"
                    value={cityState}
                    onChange={(e) => {
                      setCityState(e.target.value);
                      if (cityStateError) setCityStateError(null);
                    }}
                    error={Boolean(cityStateError)}
                    hint={cityStateError ?? undefined}
                  />
                </div>

                <div>
                  <Label>Postal Code</Label>
                  <Input
                    type="text"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      if (postalCodeError) setPostalCodeError(null);
                    }}
                    error={Boolean(postalCodeError)}
                    hint={postalCodeError ?? undefined}
                  />
                </div>

                <div>
                  <Label>TAX ID</Label>
                  <Input
                    type="text"
                    value={taxId}
                    onChange={(e) => {
                      setTaxId(e.target.value);
                      if (taxIdError) setTaxIdError(null);
                    }}
                    error={Boolean(taxIdError)}
                    hint={taxIdError ?? undefined}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={update.isPending}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
