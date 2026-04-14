import { normalizeInternalUrl } from "@/lib/siteUrl";

export function openExternalInKakao(path: string) {
  const userAgent = navigator.userAgent.toLowerCase();
  const targetUrl = normalizeInternalUrl(path);
  if (userAgent.includes("kakaotalk")) {
    try {
      window.location.href =
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetUrl);
    } catch (error) {
      console.error("외부 브라우저 로드에 실패하였습니다:", error);
    }
  }
}
