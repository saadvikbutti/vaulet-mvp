import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { ensureMember } from "@/lib/vaulet";
import { prisma } from "@/lib/prisma";
import { MemoryUploadForm } from "@/components/MemoryUploadForm";

export default async function MemoriesPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  await ensureMember(params.id, user.id);

  const memories = await prisma.memory.findMany({
    where: { vauletId: params.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        {memories.length === 0 ? (
          <p className="text-sm text-muted">No memories yet — add the first photo from this trip.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {memories.map((m) => (
              <figure key={m.id} className="bg-white border border-line rounded-xl overflow-hidden">
                <div className="relative aspect-square bg-line">
                  <Image src={m.imageUrl} alt={m.caption || "Memory"} fill className="object-cover" unoptimized />
                </div>
                <figcaption className="p-2">
                  {m.caption && <p className="text-sm font-medium truncate">{m.caption}</p>}
                  <p className="text-xs text-muted truncate">
                    {m.user.name}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
      <div>
        <MemoryUploadForm vauletId={params.id} />
      </div>
    </div>
  );
}
