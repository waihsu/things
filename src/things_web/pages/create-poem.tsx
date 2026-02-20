import { useNavigate } from "react-router";
import { toast } from "sonner";
import { PoemForm } from "@/src/interface/forms/poem-form";
import { useGetCategories } from "@/src/queries/categories/api/use-get-category";
import { useCreatePoem } from "@/src/queries/poems/api/use-create-poem";
import { useAuthStore } from "@/src/store/use-auth-store";

export default function CreatePoemPage() {
  const navigate = useNavigate();
  const createPoem = useCreatePoem();
  const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategories();
  const { user, loading } = useAuthStore();

  if (loading || isCategoriesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">Please sign in to create a poem.</div>;
  }

  return (
    <PoemForm
      categories={categories}
      submitLabel={createPoem.isPending ? "Publishing..." : "Publish Poem"}
      onSubmit={(values) =>
        createPoem.mutate(values, {
          onSuccess: (result) => {
            toast.success("Poem published successfully!");
            navigate(`/poems/${result.id}`);
          },
          onError: () => {
            toast.error("Failed to publish poem.");
          },
        })
      }
    />
  );
}
