import { EpisodeForm } from "@/src/interface/forms/episode-form";
import { useGetEpisode } from "@/src/queries/episodes/api/use-get-episode";
import { useUpdateEpisode } from "@/src/queries/episodes/api/use-update-episode";
import { useGetSerie } from "@/src/queries/series/api/use-get-serie";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function EditEpisodePage() {
  const { id, episodeId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const { data: serie } = useGetSerie(id || "");
  const { data: episode, isLoading, isError } = useGetEpisode(episodeId || "");
  const updateEpisode = useUpdateEpisode();

  if (!id || !episodeId) {
    return <div className="p-6">Invalid episode.</div>;
  }

  if (loading || isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError || !episode) {
    return <div className="p-6">Episode not found.</div>;
  }

  if (!user || (serie && user.id !== serie.user_id)) {
    return <div className="p-6">You do not have access to edit this episode.</div>;
  }

  return (
    <EpisodeForm
      seriesName={serie?.name}
      defaultValues={{
        name: episode.name,
        paragraph: episode.paragraph,
        order: episode.order ?? 1,
      }}
      submitLabel={updateEpisode.isPending ? "Saving..." : "Save Chapter"}
      onSubmit={(data) =>
        updateEpisode.mutate(
          { id: episodeId, series_id: id, ...data },
          {
            onSuccess: () => {
              toast.success("Chapter updated successfully!");
              navigate(`/series/${id}`);
            },
            onError: () => {
              toast.error("Failed to update chapter.");
            },
          },
        )
      }
    />
  );
}
