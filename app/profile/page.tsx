import getUser from "@/lib/getUser";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Profile() {
  const user = await getUser();
  if (!user) redirect("/");
  const logOut = async () => {
    "use server";
    const session = await getSession();
    await session.destroy();
    redirect("/");
  };
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 p-5 gap-3">
        <h1>안녕하세요, {user?.nickname}님!</h1>
        <form action={logOut}>
          <button className="w-24 px-3 py-1 text-center bg-green-400 rounded-full shadow-md">
            <span className="text-white font-semibold">로그아웃</span>
          </button>
        </form>
      </div>
    </div>
  );
}
