import { useParams } from "react-router-dom";
import { useLoad } from "../hooks/useLoad.js";
import { vauletService } from "../services/vauletService.js";
import { formatDate, getId } from "../utils/format.js";
import MemoryUploadForm from "../components/MemoryUploadForm.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback.jsx";

export default function MemoriesPage() {
  const { id } = useParams();
  const { data: memories = [], loading, error, refresh } = useLoad(() => vauletService.memories(id), [id]);
  if (loading) return <LoadingState label="Opening the Memory Vault…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  return (
    <div className="memories-layout">
      <div className="memory-gallery-wrap">
        {memories.length ? <div className="memory-gallery">{memories.map((memory) => <figure className="memory-card" key={getId(memory)}><img src={memory.imageUrl} alt={memory.caption || "Trip memory"} loading="lazy" /><figcaption><strong>{memory.caption || "A moment together"}</strong><span>{memory.user?.name || "A member"}{memory.location ? ` · ${memory.location}` : ""}</span><small>{formatDate(memory.takenAt || memory.createdAt)}</small></figcaption></figure>)}</div> : <EmptyState title="A place for the moments" description="Add the first photo from this trip and the Memory Vault will grow with the group." />}
      </div>
      <MemoryUploadForm vauletId={id} onAdded={refresh} />
    </div>
  );
}
