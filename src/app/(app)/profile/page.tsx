import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireUser();

  const vauletCount = await prisma.vauletMember.count({ where: { userId: user.id } });

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <div className="bg-white border border-line rounded-xl p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-accentSoft text-accent flex items-center justify-center text-2xl font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm text-muted">Name</p>
          <p className="font-medium">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Vaulets</p>
          <p className="font-medium">{vauletCount}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Member since</p>
          <p className="font-medium">{user.createdAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
