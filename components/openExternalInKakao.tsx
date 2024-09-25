"use client";

import { useEffect } from "react";
import { openExternalInKakao } from "@/lib/openExternalInKakao";

export default function OpenExternalInKakao() {
  useEffect(() => {
    openExternalInKakao();
  }, []);
  return null;
}
