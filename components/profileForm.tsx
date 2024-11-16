"use client";

import React, { useState } from "react";
import { getUploadUrl } from "@/lib/upload";

export default function ProfileForm({ user, updateProfile, logOut }: any) {
  const [nickname, setNickname] = useState(user.nickname || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isImageUpdating, setIsImageUpdating] = useState(false);
  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length <= 12) {
      setNickname(value);
    }
  };
  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingImage(true);
    setIsImageUpdating(true);
    try {
      const { success, result, error } = await getUploadUrl();
      if (!success) {
        console.error("Failed to get upload URL:", error);
        alert("이미지 업로드 URL을 가져오는데 실패했습니다.");
        setIsUploadingImage(false);
        setIsImageUpdating(false);
        return;
      }
      const { uploadURL } = result;
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch(uploadURL, {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok) {
        setIsUploadingImage(false);
        setIsImageUpdating(false);
        alert("이미지 업로드에 실패했습니다.");
        return;
      }
      const responseData = await uploadResponse.json();
      const variants = responseData.result.variants;
      const fileUrl = variants.find((url: string) => url.endsWith("/public"));
      if (!fileUrl) {
        setIsUploadingImage(false);
        setIsImageUpdating(false);
        alert("이미지 URL을 가져오는데 실패했습니다.");
        return;
      }
      setAvatarUrl(fileUrl);
      const profileFormData = new FormData();
      profileFormData.append("nickname", nickname);
      profileFormData.append("avatarUrl", fileUrl);
      await updateProfile(profileFormData);
      alert(
        "프로필 이미지가 성공적으로 업데이트되었습니다.\n반영까지 10초 정도 소요되니 여러 번 새로고침 해 주세요."
      );
    } catch (error) {
      console.error("Error in handleAvatarChange:", error);
      alert("이미지 업로드 중 에러가 발생했습니다.");
    } finally {
      setIsUploadingImage(false);
      setIsImageUpdating(false);
      event.target.value = "";
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (nickname.length < 1 || nickname.length > 12) {
      alert("닉네임은 1글자 이상 12글자 이하로 설정해 주세요.");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      formData.append("nickname", nickname);
      formData.append("avatarUrl", avatarUrl);
      await updateProfile(formData);
      alert(
        "프로필이 성공적으로 업데이트되었습니다.\n반영까지 10초 정도 소요되니 여러 번 새로고침 해 주세요."
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("프로필 업데이트에 실패했습니다.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  const handleLogOut = async () => {
    const confirmed = window.confirm("정말로 로그아웃할까요?");
    if (!confirmed) return;
    setNickname("");
    setAvatarUrl("");
    await logOut();
  };
  return (
    <div className="flex flex-col items-center mt-10">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 bg-white p-5 gap-4 relative sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          id="update-profile"
        >
          <div className="flex flex-col items-center">
            <h1 className="mb-5">안녕하세요, {user?.nickname}님!</h1>
            <div className="relative group">
              {isImageUpdating ? (
                <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="프로필 이미지"
                  className="w-32 h-32 rounded-full object-cover bg-gray-300 transition-transform duration-200 transform group-hover:scale-105"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-300"></div>
              )}
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-gray-500 rounded-full">
                  <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleAvatarChange}
              />
            </div>
            <span className="text-sm text-gray-400 mt-4">
              클릭하여 프로필 이미지를 변경할 수 있어요.
            </span>
          </div>
          <div className="flex flex-col mt-3">
            <label htmlFor="nickname" className="text-gray-700 font-semibold">
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={nickname}
              onChange={handleNicknameChange}
              className="mt-1 p-2 border rounded-lg"
              required
            />
          </div>
          <input type="hidden" name="avatarUrl" value={avatarUrl} />
        </form>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handleLogOut}
            className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500"
          >
            로그아웃
          </button>
          <button
            type="submit"
            form="update-profile"
            className={`px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-500 flex items-center justify-center ${
              isUpdatingProfile ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? (
              <>
                업데이트 중
                <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              </>
            ) : (
              "프로필 업데이트"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
