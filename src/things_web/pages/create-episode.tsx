import { EpisodeForm } from "@/src/interface/forms/episode-form";
import { useCreateEpisode } from "@/src/queries/episodes/api/use-create-episode";
import { useGetSerie } from "@/src/queries/series/api/use-get-serie";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function CreateEpisodePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const { data: serie, isLoading, isError } = useGetSerie(id || "");
  const createEpisode = useCreateEpisode();

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
    return <div className="p-6">You do not have access to add episodes.</div>;
  }

  return (
    <EpisodeForm
      seriesName={serie.name}
      submitLabel={createEpisode.isPending ? "Publishing..." : "Publish Chapter"}
      onSubmit={(data) =>
        createEpisode.mutate(
          { ...data, series_id: id },
          {
            onSuccess: () => {
              toast.success("Chapter published successfully!");
              navigate(`/series/${id}`);
            },
            onError: () => {
              toast.error("Failed to publish chapter.");
            },
          },
        )
      }
    />
  );
}
