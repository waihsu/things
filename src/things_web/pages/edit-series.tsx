import { SeriesCreateForm } from "@/src/interface/forms/series-create-form";
import { useGetCategories } from "@/src/queries/categories/api/use-get-category";
import { useGetSerie } from "@/src/queries/series/api/use-get-serie";
import { useUpdateSerie } from "@/src/queries/series/api/use-update-serie";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function EditSeriesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const { data: categories = [] } = useGetCategories();
  const { data: serie, isLoading, isError } = useGetSerie(id || "");
  const updateSeries = useUpdateSerie();

  if (!id) {
    return <div className="p-6">Invalid series.</div>;
  }

  if (loading || isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError || !serie) {
    return <div className="p-6">Series not found.</div>;
  }

  if (!user || user.id !== serie.user_id) {
    return <div className="p-6">You do not have access to edit this series.</div>;
  }

  return (
    <SeriesCreateForm
      categories={categories}
      defaultValues={{
        name: serie.name,
        summary: serie.summary ?? "",
        category_ids: serie.category_ids || [],
      }}
      submitLabel={updateSeries.isPending ? "Saving..." : "Save Changes"}
      onSubmit={(data) =>
        updateSeries.mutate(
          { id, ...data },
          {
            onSuccess: () => {
              toast.success("Series updated successfully!");
              navigate(`/series/${id}`);
            },
            onError: () => {
              toast.error("Failed to update series.");
            },
          },
        )
      }
    />
  );
}
