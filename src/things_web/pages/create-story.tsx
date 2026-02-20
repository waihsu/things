import { StoryCreateForm } from "@/src/interface/forms/story-create-form";
import { useGetCategories } from "@/src/queries/categories/api/use-get-category";
import { useCreateStory } from "@/src/queries/stories/api/use-create-story";
import { useAuthStore } from "@/src/store/use-auth-store";
import React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function CreateStoryPage() {
  const { user, loading } = useAuthStore();
  const { data: categories = [], isLoading, isError } = useGetCategories();
  const createStory = useCreateStory();
  const navigate = useNavigate();

  function saveToDB(data: {
    title: string;
    summary?: string;
    content: string;
    category_ids: string[];
  }) {
    createStory.mutate(data, {
      onSuccess: (result) => {
        toast.success("Story published successfully!");
        navigate(`/stories/${result.id}`);
      },
      onError: () => {
        toast.error("Failed to publish story.");
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
    return <div className="p-6">Please sign in to create a story.</div>;
  }
  return (
    <StoryCreateForm
      categories={categories}
      onSubmit={saveToDB}
      submitLabel={createStory.isPending ? "Publishing..." : "Publish Story"}
    />
  );
}

export default CreateStoryPage;
