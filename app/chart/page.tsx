import Chart from "@/components/chart";
import OpenExternalInKakao from "@/components/openExternalInKakao";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return generatePageMetadata("주식 차트", "/chart");
}

export default function ChartPage() {
  return (
    <div className="flex flex-col items-center my-5 sm:my-10 sm:gap-10">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 bg-white p-5 gap-2 relative sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
        <span className="font-bold text-lg">주식 차트</span>
        <span className="text-sm text-gray-500">
          원하는 종목의 티커나 종목명을 검색해 차트를 확인해보세요. (미국 주식,
          해외 주식, 코인, 해외 선물 등)
        </span>
      </div>
      <OpenExternalInKakao path="/chart" />
      <Chart />
    </div>
  );
}
