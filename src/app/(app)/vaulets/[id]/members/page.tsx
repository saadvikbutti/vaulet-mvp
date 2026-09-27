import { requireUser } from "@/lib/auth";
import { ensureMember } from "@/lib/vaulet";
import { prisma } from "@/lib/prisma";
import { AddMemberForm } from "@/components/AddMemberForm";

export default async function MembersPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  await ensureMember(params.id, user.id);

  const members = await prisma.vauletMember.findMany({
    where: { vauletId: params.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Invite someone</h3>
        <p className="text-sm text-muted mb-3">They need a Vaulet account already — invite them to sign up first if not.</p>
        <AddMemberForm vauletId={params.id} />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Members ({members.length})</h3>
        <div className="bg-white border border-line rounded-xl divide-y divide-line">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{m.user.name}</p>
                <p className="text-xs text-muted">{m.user.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-accentSoft text-accent font-medium capitalize">{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
