import { useQuery } from "@tanstack/react-query";

export type Category = {
  id: string;
  name: string;
};

type CategoriesResponse = {
  categories: Category[];
};

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/v1/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  const data = (await response.json()) as CategoriesResponse;
  return data.categories;
}

export function useGetCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });
}
