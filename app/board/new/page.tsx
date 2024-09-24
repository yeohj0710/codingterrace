"use client";

import Input from "@/components/input";
import { useEffect, useState } from "react";
import { getUploadUrl, getUser, uploadPost } from "./actions";

export default function AddPost() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    fetchUser();
  }, []);
  const onImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const previewUrls: string[] = [];
    const uploadedUrls: string[] = [];
    setIsUploadingImages(true);
    for (const file of fileArray) {
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      const { success, result } = await getUploadUrl();
      if (!success) {
        setIsUploadingImages(false);
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
        setIsUploadingImages(false);
        return;
      }
      const responseData = await uploadResponse.json();
      const fileUrl = responseData.result.variants[0];
      uploadedUrls.push(fileUrl);
    }
    setPreviews(previewUrls);
    setImageUrls(uploadedUrls);
    setIsUploadingImages(false);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUploadingImages) {
      alert("이미지 업로드 중입니다. 잠시만 기다려 주세요.");
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    imageUrls.forEach((url) => {
      formData.append(`images[]`, url);
    });
    await uploadPost(null, formData);
    setIsSubmitting(false);
  };
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 mx-auto pt-8 sm:pb-10">
        <h1 className="text-xl font-bold ml-5 sm:ml-0 sm:mb-5">게시글 작성</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              제목
            </label>
            <Input
              name="title"
              type="text"
              required
              placeholder="제목을 입력해 주세요."
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                작성자
              </label>
              {user ? (
                <div className="px-2 py-1.5 border rounded-lg text-gray-500 bg-gray-200">
                  {user.nickname ?? "익명"}
                </div>
              ) : (
                <Input
                  name="nickname"
                  type="text"
                  placeholder="닉네임을 입력해 주세요. (선택)"
                  className="w-full px-2 py-1.5 border rounded-lg"
                />
              )}
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                비밀번호{" "}
                <label className="text-xs">(비회원 게시글 삭제 시 필요) </label>
              </label>
              {user ? (
                <div className="px-2 py-1.5 border rounded-lg text-gray-500 bg-gray-200">
                  　
                </div>
              ) : (
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력해 주세요. (선택)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-lg"
                />
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              내용
            </label>
            <textarea
              name="content"
              placeholder="내용을 입력해 주세요."
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-4">
              이미지 추가
            </label>
            <div className="flex flex-wrap gap-2">
              {previews.map((preview, index) => (
                <label
                  key={index}
                  className="border-2 aspect-square w-24 h-24 flex items-center justify-center flex-col text-neutral-300 border-neutral-300 rounded-md border-dashed cursor-pointer bg-center bg-cover"
                  style={{
                    backgroundImage: `url(${preview})`,
                  }}
                />
              ))}
            </div>
            <label
              htmlFor="image"
              className="mt-2 px-4 py-2 bg-green-400 text-white rounded-lg cursor-pointer hover:bg-green-500"
            >
              이미지 선택
            </label>
            <input
              onChange={onImageChange}
              type="file"
              id="image"
              name="image"
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
          <div className="flex justify-end">
            {!isSubmitting ? (
              <button
                type="submit"
                className="bg-green-400 text-white px-4 py-1.5 rounded-lg hover:bg-green-500"
              >
                등록
              </button>
            ) : (
              <button
                type="submit"
                className="bg-gray-400 text-gray-700 cursor-not-allowed opacity-50 px-4 py-1.5 rounded-lg"
              >
                등록 중
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
