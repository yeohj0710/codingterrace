export function categoryToName(category: string): string {
  switch (category) {
    case "board":
      return "자유게시판";
    case "technote":
      return "기술노트";
    case "main":
      return "사용자 알림";
    case "weather":
      return "날씨";
    default:
      return "자유게시판";
  }
}

export function stripMarkdown(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([\s\S]*?\)/g, "")
    .replace(/#[^\n]*/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\n/g, " ");
  // .replace(/\[([^\]]*)\]\([\s\S]*?\)/g, "$1");
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
