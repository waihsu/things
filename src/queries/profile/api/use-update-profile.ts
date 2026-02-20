import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Profile, ProfileApi } from "./types";
import { normalizeProfile } from "./types";

export type UpdateProfileInput = {
  name: string;
  username?: string | null;
  phone_number?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  urls?: string[] | null;
};

type UpdateProfileResponse = {
  profile: ProfileApi;
};

async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const response = await fetch("/api/v1/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Failed to update profile";
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const data = (await response.json()) as UpdateProfileResponse;
  return normalizeProfile(data.profile);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
    },
  });
}
