export function openExternalInKakao(path: string) {
  const userAgent = navigator.userAgent.toLowerCase();
  const baseUrl = process.env.SITE_URL || "https://codingterrace.com";
  const targetUrl = `${baseUrl}${path}`;
  if (userAgent.includes("kakaotalk")) {
    try {
      window.location.href =
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetUrl);
    } catch (error) {
      console.error("외부 브라우저 로드에 실패하였습니다:", error);
    }
  }
}
