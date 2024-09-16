import { useState, useEffect } from "react";

export default function CustomAlert() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice = window.matchMedia("(max-width: 768px)").matches;
      setIsMobile(isMobileDevice);
    };
    checkIfMobile();
  }, []);
  const handleClose = () => {
    setIsVisible(false);
  };
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-5 rounded shadow-md text-center">
        {isMobile ? (
          <div>
            <p className="mb-4">모바일입니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span>
              알림 권한이 <span className="text-red-600">차단</span>되어
              있으시군요!
            </span>
            <span>사이트의 원활한 이용을 위해 알림을 허용해 주세요.</span>
            <img
              src="/permission-pc-1.png"
              alt="Alert Image"
              className="w-full h-32 mt-2 object-cover border-green-400 border-4"
            />
            <span>1. 주소 왼쪽의 '사이트 정보' 버튼을 클릭합니다.</span>
            <img
              src="/permission-pc-2.png"
              alt="Alert Image"
              className="w-full h-32 mt-2 object-cover border-green-400 border-4"
            />
            <span>2. 알림을 허용으로 변경합니다.</span>
            <img
              src="/permission-pc-3.png"
              alt="Alert Image"
              className="w-full h-32 mt-2 object-cover border-green-400 border-4"
            />
            <span>3. 새로고침하여 페이지를 새로 로드합니다.</span>
          </div>
        )}
        <button
          onClick={handleClose}
          className="bg-green-500 mt-4 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          확인
        </button>
      </div>
    </div>
  );
}
