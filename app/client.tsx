"use client";

import { useEffect } from "react";

export default function OpenExternalInKakao() {
  useEffect(() => {
    openExternalInKakao();
  }, []);
  const openExternalInKakao = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = "https://codingterrace.com";
    if (userAgent.includes("kakaotalk")) {
      window.location.href =
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetUrl);
    }
  };
  return null;
}
