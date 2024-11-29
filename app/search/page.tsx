import SearchResults from "@/components/searchResults";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: any;
}) {
  const query = (searchParams.query as string) || "";
  return generatePageMetadata(
    `검색 결과: ${query}`,
    `/search?query=${encodeURIComponent(query)}`
  );
}

export default function SearchPage({ searchParams }: { searchParams: any }) {
  const query = (searchParams.query as string) || "";
  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center sm:my-10">
        <p>검색어를 입력해주세요.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center sm:my-10">
      <SearchResults query={query} />
    </div>
  );
}
