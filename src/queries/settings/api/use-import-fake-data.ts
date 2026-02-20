import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FakeImportResult } from "./types";

type ImportResponse = {
  result: FakeImportResult;
};

async function importFakeData(): Promise<ImportResponse> {
  const response = await fetch("/api/v1/settings/import-fake-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let message = "Failed to import fake data";
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return response.json() as Promise<ImportResponse>;
}

export function useImportFakeData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importFakeData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

