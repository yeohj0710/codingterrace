"use client";

import { useEffect, useState } from "react";

type GuideMode = "desktop" | "mobile";

const GUIDE_CONTENT: Record<
  GuideMode,
  Array<{ image: string; alt: string; text: string }>
> = {
  desktop: [
    {
      image: "/permission-pc-1.png",
      alt: "PC 알림 권한 안내 1",
      text: "주소창 왼쪽의 '사이트 정보' 버튼을 눌러 주세요.",
    },
    {
      image: "/permission-pc-2.png",
      alt: "PC 알림 권한 안내 2",
      text: "알림 권한을 '허용'으로 바꿔 주세요.",
    },
    {
      image: "/permission-pc-3.png",
      alt: "PC 알림 권한 안내 3",
      text: "페이지를 한 번 새로고침하면 설정이 반영돼요.",
    },
  ],
  mobile: [
    {
      image: "/permission-mobile-1.jpg",
      alt: "모바일 알림 권한 안내 1",
      text: "주소창 왼쪽의 '사이트 정보' 메뉴를 열어 주세요.",
    },
    {
      image: "/permission-mobile-3.jpg",
      alt: "모바일 알림 권한 안내 2",
      text: "'알림' 항목으로 들어가 주세요.",
    },
    {
      image: "/permission-mobile-4.jpg",
      alt: "모바일 알림 권한 안내 3",
      text: "알림 권한을 '허용'으로 바꾸면 바로 사용할 수 있어요.",
    },
  ],
};

export default function CustomAlert({ onClose }: { onClose: () => void }) {
  const [guideMode, setGuideMode] = useState<GuideMode>("desktop");

  useEffect(() => {
    const isMobileDevice = window.matchMedia("(max-width: 768px)").matches;
    setGuideMode(isMobileDevice ? "mobile" : "desktop");
  }, []);

  const steps = GUIDE_CONTENT[guideMode];

  return (
    <div className="mb-4 overflow-hidden rounded-md border border-emerald-200 bg-emerald-50/80 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-emerald-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-emerald-950">
            알림 권한이 꺼져 있어요
          </p>
          <p className="mt-1 text-xs text-emerald-900/80">
            한 번만 허용해 두면 새 글과 공지 알림을 계속 받아볼 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-900 transition hover:bg-emerald-100"
        >
          닫기
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="mb-3 inline-flex rounded-md border border-emerald-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setGuideMode("desktop")}
            className={`rounded-sm px-3 py-1.5 text-xs font-medium transition ${
              guideMode === "desktop"
                ? "bg-emerald-500 text-white"
                : "text-emerald-900 hover:bg-emerald-100"
            }`}
          >
            PC
          </button>
          <button
            type="button"
            onClick={() => setGuideMode("mobile")}
            className={`rounded-sm px-3 py-1.5 text-xs font-medium transition ${
              guideMode === "mobile"
                ? "bg-emerald-500 text-white"
                : "text-emerald-900 hover:bg-emerald-100"
            }`}
          >
            모바일
          </button>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={`${guideMode}-${index}`}
              className="rounded-md bg-white p-3 ring-1 ring-emerald-100"
            >
              <div className="overflow-hidden rounded-sm border border-emerald-100 bg-slate-50">
                <img
                  src={step.image}
                  alt={step.alt}
                  className="h-40 w-full object-cover object-top"
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                <span className="mr-1 font-semibold text-emerald-700">
                  {index + 1}.
                </span>
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
