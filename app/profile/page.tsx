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
      throw new Error("올바른 닉네임을 입력해 주세요.");
    }

    if (!isAllowedAvatarUrl(parsed.data.avatarUrl)) {
      throw new Error("허용된 이미지 주소만 프로필 사진으로 사용할 수 있습니다.");
    }

    try {
      const existingUser = await db.user.findUnique({
        where: { nickname: parsed.data.nickname },
        select: { idx: true },
      });

      if (existingUser && existingUser.idx !== session.idx) {
        throw new Error("이미 사용 중인 닉네임입니다.");
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
      throw new Error(error?.message || "프로필을 업데이트하지 못했습니다.");
    }

    redirect("/profile");
  };

  return (
    <ProfileForm user={user} updateProfile={updateProfile} logOut={logOut} />
  );
}
