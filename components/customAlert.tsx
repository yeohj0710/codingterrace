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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-2">
      <div className="bg-white p-5 rounded shadow-md text-center">
        {isMobile ? (
          <div className="flex flex-col items-center gap-2">
            <span>
              알림 권한이 <span className="text-red-600">차단</span>되어
              있으시군요!
            </span>
            <span>사이트의 원활한 이용을 위해 알림을 허용해 주세요.</span>
            <div className="flex flex-col items-center gap-2 overflow-y-scroll h-full max-h-[50vh]">
              <img
                src="/permission-mobile-1.jpg"
                alt="Alert Image"
                className="w-full h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>1. 주소 왼쪽의 &apos;사이트 정보&apos;를 선택합니다.</span>
              <img
                src="/permission-mobile-2.jpg"
                alt="Alert Image"
                className="w-full h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>2. &apos;권한&apos;을 선택합니다.</span>
              <img
                src="/permission-mobile-3.jpg"
                alt="Alert Image"
                className="w-full h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>3. &apos;알림&apos;을 선택합니다.</span>
              <img
                src="/permission-mobile-4.jpg"
                alt="Alert Image"
                className="w-full h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>4. 알림 허용을 &apos;허용&apos;으로 변경합니다.</span>
              <img
                src="/permission-button.png"
                alt="Alert Image"
                className="w-full h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>
                5. 알림 아이콘을 터치해 알림을 받을 수 있는 상태로 설정합니다.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span>
              알림 권한이 <span className="text-red-600">차단</span>되어
              있으시군요!
            </span>
            <span>사이트의 원활한 이용을 위해 알림을 허용해 주세요.</span>
            <div className="flex flex-col items-center gap-2 overflow-y-scroll h-full max-h-[50vh]">
              <img
                src="/permission-pc-1.png"
                alt="Alert Image"
                className="w-[384px] h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>
                1. 주소 왼쪽의 &apos;사이트 정보&apos; 버튼을 클릭합니다.
              </span>
              <img
                src="/permission-pc-2.png"
                alt="Alert Image"
                className="w-[384px] h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>2. 알림을 허용으로 변경합니다.</span>
              <img
                src="/permission-pc-3.png"
                alt="Alert Image"
                className="w-[384px] h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>3. 새로고침하여 페이지를 새로 로드합니다.</span>
              <img
                src="/permission-button.png"
                alt="Alert Image"
                className="w-[384px] h-full mt-2 object-cover border-green-400 border-4"
              />
              <span>
                4. 알림 아이콘을 클릭해 알림을 받을 수 있는 상태로 설정합니다.
              </span>
            </div>
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
