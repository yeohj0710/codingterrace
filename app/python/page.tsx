import OpenExternalInKakao from "@/components/openExternalInKakao";
import Weather from "@/components/weather";

export default function Python() {
  return (
    <div className="flex flex-col items-center my-5 sm:my-10 sm:gap-10">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 bg-white p-5 gap-2 relative sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
        <span className="font-bold text-lg">파이썬 기능 테스트</span>
        <span className="text-sm text-gray-500">
          이곳에서는 파이썬으로 구현한 다양한 코드를 Next.js 환경에서 이용할 수
          있어요.
        </span>
      </div>
      <OpenExternalInKakao />
      <Weather />
    </div>
  );
}
