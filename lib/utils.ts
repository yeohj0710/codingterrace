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

export function formatIp(ip: string | null): string {
  if (ip === null) {
    return "192.168";
  }
  const segments = ip.split(":")[0].split(".");
  if (segments.length < 2) {
    return "192.168";
  }
  return segments.slice(0, 2).join(".");
}
