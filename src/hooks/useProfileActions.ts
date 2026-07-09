import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { meApi, type UpdateProfileInput } from "../services/api/me";

/**
 * Actions on the authenticated user's own account. No permission required —
 * mirrors the backend's me.* endpoints, which only check that a user is
 * authenticated (see MeController/AvatarController authorize()). Every
 * mutation re-fetches the app-wide principal on success so the header,
 * sidebar, and this page all reflect the change immediately, the same way
 * useOrganizationActions() re-syncs org state after an org edit.
 */
export function useProfileActions() {
  const { refresh } = useAuth();

  return {
    update: useMutation({
      mutationFn: (payload: UpdateProfileInput) => meApi.updateProfile(payload),
      onSuccess: () => refresh(),
    }),
    uploadAvatar: useMutation({
      mutationFn: (file: File) => meApi.uploadAvatar(file),
      onSuccess: () => refresh(),
    }),
    removeAvatar: useMutation({
      mutationFn: () => meApi.deleteAvatar(),
      onSuccess: () => refresh(),
    }),
  };
}
