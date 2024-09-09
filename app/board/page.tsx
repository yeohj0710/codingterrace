async function getPosts() {}

export default async function Board() {
  const posts = await getPosts();
  return (
    <div className="flex flex-col h-[150vh] bg-white p-5 gap-2 relative">
      <span className="font-bold">게시판</span>
    </div>
  );
}
