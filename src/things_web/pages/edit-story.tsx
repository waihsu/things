import { StoryCreateForm } from "@/src/interface/forms/story-create-form";
import { useGetCategories } from "@/src/queries/categories/api/use-get-category";
import { useGetStory } from "@/src/queries/stories/api/use-get-story";
import { useUpdateStory } from "@/src/queries/stories/api/use-update-story";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function EditStoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const { data: categories = [] } = useGetCategories();
  const { data: story, isLoading, isError } = useGetStory(id || "");
  const updateStory = useUpdateStory();

  if (!id) {
    return <div className="p-6">Invalid story.</div>;
  }

  if (loading || isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError || !story) {
    return <div className="p-6">Story not found.</div>;
  }

  if (!user || user.id !== story.user_id) {
    return <div className="p-6">You do not have access to edit this story.</div>;
  }

  return (
    <StoryCreateForm
      categories={categories}
      defaultValues={{
        title: story.title,
        summary: story.summary ?? "",
        content: story.content,
        category_ids: story.category_ids || [],
      }}
      submitLabel={updateStory.isPending ? "Saving..." : "Save Changes"}
      onSubmit={(data) =>
        updateStory.mutate(
          { id, ...data },
          {
            onSuccess: () => {
              toast.success("Story updated successfully!");
              navigate(`/stories/${id}`);
            },
            onError: () => {
              toast.error("Failed to update story.");
            },
          },
        )
      }
    />
  );
}
