export function categoryToName(category: string): string {
  switch (category) {
    case "board":
      return "자유게시판";
    case "technote":
      return "기술노트";
    default:
      return "자유게시판";
  }
}
