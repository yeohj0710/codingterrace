import ProfileForm from "@/components/profileForm";
import { getUser } from "@/lib/auth";
import db from "@/lib/db";
import { generatePageMetadata } from "@/lib/metadata";
import getSession from "@/lib/session";
import { isAllowedAvatarUrl } from "@/lib/siteUrl";
import { redirect } from "next/navigation";
import { z } from "zod";

const profileSchema = z.object({
  nickname: z.string().trim().min(1).max(12),
  avatarUrl: z.string().trim().max(2048).optional(),
});

export async function generateMetadata() {
  return generatePageMetadata("Profile", "/profile");
}

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const logOut = async () => {
    "use server";
    const session = await getSession();
    await session.destroy();
    redirect("/");
  };

  const updateProfile = async (formData: FormData) => {
    "use server";

    const session = await getSession();

    if (!session.idx) {
      redirect("/");
    }

    const parsed = profileSchema.safeParse({
      nickname: formData.get("nickname"),
      avatarUrl: formData.get("avatarUrl") || "",
    });

    if (!parsed.success) {
      throw new Error("Please provide a valid nickname.");
    }

    if (!isAllowedAvatarUrl(parsed.data.avatarUrl)) {
      throw new Error("Only approved image URLs can be used as avatars.");
    }

    try {
      const existingUser = await db.user.findUnique({
        where: { nickname: parsed.data.nickname },
        select: { idx: true },
      });

      if (existingUser && existingUser.idx !== session.idx) {
        throw new Error("That nickname is already in use.");
      }

      await db.user.update({
        where: { idx: session.idx },
        data: {
          nickname: parsed.data.nickname,
          avatar: parsed.data.avatarUrl || null,
        },
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw new Error(error?.message || "Failed to update the profile.");
    }

    redirect("/profile");
  };

  return (
    <ProfileForm user={user} updateProfile={updateProfile} logOut={logOut} />
  );
}
