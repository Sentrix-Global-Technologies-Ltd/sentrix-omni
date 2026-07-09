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

// Loose but real: rejects obviously-invalid content (letters, symbols) while
// still allowing international formats (+, spaces, hyphens, parentheses).
// Mirrors the backend's UpdateProfileRequest phone regex exactly.
const PHONE_PATTERN = /^[0-9+()\-\s]{7,32}$/;

const BIO_MAX = 500;

export default function UserInfoCard() {
  const { principal } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const { update } = useProfileActions();
  const toast = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);

  function handleOpen() {
    setName(principal?.name ?? "");
    setPhone(principal?.phone ?? "");
    setBio(principal?.bio ?? "");
    setNameError(null);
    setPhoneError(null);
    setBioError(null);
    openModal();
  }

  function validate(): boolean {
    let ok = true;

    if (name.trim().length === 0) {
      setNameError("Name is required.");
      ok = false;
    } else {
      setNameError(null);
    }

    // Phone is optional — only validate the format if something was typed.
    if (phone.trim().length > 0 && !PHONE_PATTERN.test(phone.trim())) {
      setPhoneError("Enter a valid phone number (digits, spaces, +, -, and () only).");
      ok = false;
    } else {
      setPhoneError(null);
    }

    if (bio.length > BIO_MAX) {
      setBioError(`Bio must be ${BIO_MAX} characters or fewer.`);
      ok = false;
    } else {
      setBioError(null);
    }

    return ok;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      await update.mutateAsync({
        name: name.trim(),
        // Optional fields: an emptied input is sent as null (not ""), matching
        // the backend's 'nullable' rule so clearing a field actually clears it
        // instead of failing format validation on an empty string.
        phone: phone.trim() === "" ? null : phone.trim(),
        bio: bio.trim() === "" ? null : bio.trim(),
      });
      toast.success("Profile updated");
      closeModal();
    } catch (err) {
      if (err instanceof ValidationError) {
        if (err.errors.name) setNameError(err.errors.name[0]);
        if (err.errors.phone) setPhoneError(err.errors.phone[0]);
        if (err.errors.bio) setBioError(err.errors.bio[0]);
      }
      toast.error(err instanceof ApiError ? err.message : "Could not update profile. Please try again.");
    }
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {principal?.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {principal?.email ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {principal?.phone ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Bio</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {principal?.bio ?? "—"}
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

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <div className="flex flex-col">
            <div className="custom-scrollbar h-[350px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    error={Boolean(nameError)}
                    hint={nameError ?? undefined}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={principal?.email ?? ""}
                    disabled
                    hint="Email can't be changed — it's how your account is identified."
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    error={Boolean(phoneError)}
                    hint={phoneError ?? undefined}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Bio</Label>
                  <Input
                    type="text"
                    value={bio}
                    onChange={(e) => {
                      setBio(e.target.value);
                      if (bioError) setBioError(null);
                    }}
                    error={Boolean(bioError)}
                    hint={bioError ?? `${bio.length}/${BIO_MAX}`}
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
    </div>
  );
}
