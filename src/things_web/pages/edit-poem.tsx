import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PoemForm } from "@/src/interface/forms/poem-form";
import { useGetCategories } from "@/src/queries/categories/api/use-get-category";
import { useGetPoem } from "@/src/queries/poems/api/use-get-poem";
import { useUpdatePoem } from "@/src/queries/poems/api/use-update-poem";
import { useAuthStore } from "@/src/store/use-auth-store";

export default function EditPoemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const { data: poem, isLoading, isError } = useGetPoem(id || "");
  const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategories();
  const updatePoem = useUpdatePoem();

  if (!id) {
    return <div className="p-6">Invalid poem.</div>;
  }

  if (loading || isLoading || isCategoriesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError || !poem) {
    return <div className="p-6">Poem not found.</div>;
  }

  if (!user || user.id !== poem.user_id) {
    return <div className="p-6">You do not have access to edit this poem.</div>;
  }

  return (
    <PoemForm
      categories={categories}
      defaultValues={{
        title: poem.title,
        content: poem.content,
        category_ids: poem.category_ids || [],
        tags: poem.tags || [],
      }}
      submitLabel={updatePoem.isPending ? "Saving..." : "Save Changes"}
      onSubmit={(values) =>
        updatePoem.mutate(
          { id, ...values },
          {
            onSuccess: () => {
              toast.success("Poem updated successfully!");
              navigate(`/poems/${id}`);
            },
            onError: () => {
              toast.error("Failed to update poem.");
            },
          },
        )
      }
    />
  );
}
