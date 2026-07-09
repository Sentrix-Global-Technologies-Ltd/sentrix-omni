import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import { useProfileActions } from "../../hooks/useProfileActions";
import { useToast } from "../shared/toast";
import { ApiError } from "../../services/api/errors";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Avatar from "../ui/avatar/Avatar";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB, mirrors the backend's max:5120 rule
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function UserMetaCard() {
  const { principal } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const { uploadAvatar, removeAvatar } = useProfileActions();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const name = principal?.name ?? "";
  const role = principal?.roles[0] ?? null;
  const line1 = principal?.bio || role;
  const line2 = principal?.city_state || null;

  const busy = uploadAvatar.isPending || removeAvatar.isPending;

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFileError("Image must be 5MB or smaller.");
      return;
    }
    setFileError(null);

    uploadAvatar.mutate(file, {
      onSuccess: () => {
        toast.success("Photo updated");
        closeModal();
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not upload photo. Please try again.");
      },
    });
  }

  function handleRemove() {
    removeAvatar.mutate(undefined, {
      onSuccess: () => {
        toast.success("Photo removed");
        closeModal();
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not remove photo. Please try again.");
      },
    });
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <Avatar src={principal?.avatar_url ?? undefined} name={name} size="xlarge" />
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {name}
              </h4>
              {(line1 || line2) && (
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  {line1 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{line1}</p>
                  )}
                  {line1 && line2 && (
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  )}
                  {line2 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{line2}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setFileError(null);
              openModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit Photo
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Upload a new photo
            </h4>

            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              JPEG, PNG, or WebP. Up to 5MB.
            </p>
          </div>

          <div className="flex flex-col items-center gap-5 px-2">
            <Avatar src={principal?.avatar_url ?? undefined} name={name} size="xxlarge" />

            {fileError && <p className="text-theme-xs text-error-500">{fileError}</p>}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChosen}
            />

            <div className="flex w-full items-center gap-3">
              <Button
                className="flex-1/2"
                variant="primary"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadAvatar.isPending ? "Uploading…" : "Select File"}
              </Button>
              {principal?.avatar_url && (
                <Button className="flex-1/2" variant="outline" disabled={busy} onClick={handleRemove}>
                  {removeAvatar.isPending ? "Removing…" : "Remove"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
