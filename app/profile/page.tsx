import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import db from "@/lib/db";
import ProfileForm from "@/components/profileForm";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const logOut = async () => {
    "use server";
    const session = await getSession();
    await session.destroy();
    redirect("/");
  };
  const updateProfile = async (formData: FormData) => {
    "use server";
    const nickname = formData.get("nickname") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const session = await getSession();
    if (!session.idx) {
      redirect("/");
    }
    if (!nickname) {
      throw new Error("닉네임을 입력해주세요.");
    }
    try {
      const existingUser = await db.user.findUnique({
        where: { nickname },
      });

      if (existingUser && existingUser.idx !== session.idx) {
        throw new Error("이미 사용 중인 닉네임입니다.");
      }
      await db.user.update({
        where: { idx: session.idx },
        data: {
          nickname,
          avatar: avatarUrl,
        },
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw new Error("프로필 업데이트에 실패했습니다.");
    }
    redirect("/profile");
  };
  return (
    <ProfileForm user={user} updateProfile={updateProfile} logOut={logOut} />
  );
}
