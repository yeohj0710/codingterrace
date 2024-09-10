export function categoryToName(category: string): string {
  const categories = ["board"];
  const names = ["자유게시판"];
  const index = categories.indexOf(category);
  if (index === -1) {
    return "";
  }
  return names[index];
}
