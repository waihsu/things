import { SeriesCreateForm } from "@/src/interface/forms/series-create-form";
import { useGetCategories } from "@/src/queries/categories/api/use-get-category";
import { useCreateSerie } from "@/src/queries/series/api/use-create-serie";
import { useAuthStore } from "@/src/store/use-auth-store";
import React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function CreateSeriesPage() {
  const { user, loading } = useAuthStore();
  const { data: categories = [], isLoading, isError } = useGetCategories();
  const createSeries = useCreateSerie();
  const navigate = useNavigate();

  function saveToDB(data: {
    name: string;
    summary?: string;
    category_ids: string[];
  }) {
    createSeries.mutate(data, {
      onSuccess: (result) => {
        toast.success("Series published successfully!");
        navigate(`/series/${result.id}`);
      },
      onError: () => {
        toast.error("Failed to publish series.");
      },
    });
  }

  if (loading || isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError) {
    return <div className="p-6">Failed to load categories.</div>;
  }

  if (!user) {
    return <div className="p-6">Please sign in to create a series.</div>;
  }

  return (
    <SeriesCreateForm
      categories={categories}
      onSubmit={saveToDB}
      submitLabel={createSeries.isPending ? "Publishing..." : "Publish Series"}
    />
  );
}

export default CreateSeriesPage;
