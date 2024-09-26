"use client";

import Input from "@/components/input";
import { useEffect, useRef, useState } from "react";
import { getUploadUrl, getUser, uploadPost } from "@/app/actions";
import { handlePaste } from "@/lib/handlePaste";

interface AddPostProps {
  category: string;
  basePath: string;
}

export default function AddPost({ category, basePath }: AddPostProps) {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    fetchUser();
  }, [content]);
  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setContent(event.target.value);
  };
  const handleCompositionStart = () => {
    setIsComposing(true);
  };
  const handleCompositionEnd = (
    event: React.CompositionEvent<HTMLTextAreaElement>
  ) => {
    setIsComposing(false);
    const value = (event.target as HTMLTextAreaElement).value;
    setContent(value);
  };
  const onImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setIsUploadingImages(true);
    let currentSelectionStart = contentRef.current?.selectionStart;
    let currentSelectionEnd = contentRef.current?.selectionEnd;
    for (const file of fileArray) {
      const { success, result, error } = await getUploadUrl();
      if (!success) {
        console.error("Failed to get upload URL:", error);
        alert("이미지 업로드 URL을 가져오는데 실패했습니다.");
        setIsUploadingImages(false);
        return;
      }
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
      const variants = responseData.result.variants;
      const fileUrl = variants.find((url: string) => url.endsWith("/public"));
      if (!fileUrl) {
        setIsUploadingImages(false);
        return;
      }
      const markdownImageTag = `![이미지 설명](${fileUrl})\n`;
      const beforeSelection = content.substring(0, currentSelectionStart!);
      const afterSelection = content.substring(currentSelectionEnd!);
      const newContent = beforeSelection + markdownImageTag + afterSelection;
      setContent(newContent);
      setTimeout(() => {
        if (contentRef.current) {
          const newCursorPosition =
            currentSelectionStart! + markdownImageTag.length;
          contentRef.current.selectionStart = newCursorPosition;
          contentRef.current.selectionEnd = newCursorPosition;
          contentRef.current.focus();
        }
      }, 0);
    }
    setIsUploadingImages(false);
    event.target.value = "";
  };
  const handlePasteEvent = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    await handlePaste(
      event,
      setIsUploadingImages,
      content,
      setContent,
      contentRef
    );
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUploadingImages) {
      alert("이미지 업로드 중입니다. 잠시만 기다려 주세요.");
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await uploadPost(category, basePath, formData);
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
            <div className="relative">
              <textarea
                ref={contentRef}
                name="content"
                placeholder="내용을 입력해 주세요."
                required
                value={content}
                onChange={handleContentChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onPaste={handlePasteEvent}
                rows={10}
                className="w-full p-3 border rounded-lg"
                disabled={isUploadingImages}
              />
              {isUploadingImages && (
                <div className="absolute inset-0 flex justify-center items-center bg-opacity-75 bg-white">
                  <div className="w-5 h-5 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
                  <span className="ml-3 text-lg text-gray-700">
                    이미지 업로드 중...
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-4">
              이미지 추가
            </label>
            <div className="relative inline-block">
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-lg flex items-center justify-center ${
                isSubmitting
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-50"
                  : "bg-green-400 text-white hover:bg-green-500"
              }`}
            >
              {isSubmitting ? (
                <>
                  등록 중
                  <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </>
              ) : (
                "등록"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
