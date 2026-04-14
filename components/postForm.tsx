"use client";

import { useEffect, useRef, useState } from "react";
import { getUser } from "@/lib/auth";
import { handleImageChange } from "@/lib/handleImageChange";
import { clearPostCache } from "@/lib/cache";
import { saveSubscription, urlBase64ToUint8Array } from "@/lib/notification";
import { getPost, uploadPost, updatePost, verifyPostPassword } from "@/lib/post";
import { handlePaste } from "@/lib/handlePaste";
import Input from "@/components/input";
import { useRouter } from "next/navigation";

interface PostFormProps {
  mode: "add" | "edit";
  idx?: string;
  category: string;
  basePath: string;
}

export default function PostForm({
  mode,
  idx,
  category,
  basePath,
}: PostFormProps) {
  const [user, setUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [verifiedGuestPassword, setVerifiedGuestPassword] = useState("");
  const [content, setContent] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAllData = async () => {
      const userData = await getUser();
      setUser(userData);

      if (mode !== "edit" || !idx) {
        return;
      }

      const postData = await getPost(Number(idx), category);

      if (!postData) {
        alert("요청한 게시글을 찾을 수 없습니다.");
        router.push(basePath);
        return;
      }

      setPost(postData);
      setTitle(postData.title);
      setContent(postData.content);
      setNickname(postData.nickname ?? "");

      if (postData.user) {
        if (!userData || userData.idx !== postData.user.idx) {
          alert("이 게시글을 수정할 권한이 없습니다.");
          router.push(basePath);
        }
        return;
      }

      if (!postData.hasPassword) {
        alert("이 익명 게시글은 더 이상 수정할 수 없습니다.");
        router.push(basePath);
        return;
      }

      const passwordInput = window.prompt("게시글 비밀번호를 입력해 주세요.");

      if (!passwordInput) {
        router.push(basePath);
        return;
      }

      let isValidPassword = false;

      try {
        isValidPassword = await verifyPostPassword(postData.idx, passwordInput);
      } catch {
        isValidPassword = false;
      }

      if (!isValidPassword) {
        alert("게시글 비밀번호가 올바르지 않습니다.");
        router.push(basePath);
        return;
      }

      setVerifiedGuestPassword(passwordInput);
      setPassword(passwordInput);
    };

    fetchAllData();
  }, [mode, idx, category, basePath, router]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setContent(event.target.value);
  };

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(
      event,
      setIsUploadingImages,
      content,
      setContent,
      contentRef
    );
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
      alert("이미지 업로드가 아직 끝나지 않았어요. 잠시만 기다려 주세요.");
      return;
    }

    setIsSubmitting(true);
    let postId: number | null = null;

    try {
      const formData = new FormData(e.currentTarget);

      if (mode === "add") {
        postId = await uploadPost(category, basePath, formData);

        if ("serviceWorker" in navigator && "PushManager" in window) {
          const permission = await Notification.requestPermission();

          if (permission === "granted") {
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                  process.env.NEXT_PUBLIC_VAPID_KEY as string
                ),
              });
            }

            const subscriptionData = {
              ...subscription.toJSON(),
              type: "postAuthor",
              postId,
            };
            await saveSubscription(subscriptionData);
          }
        }
      } else if (mode === "edit" && idx) {
        formData.append("idx", idx);
        if (!post?.user) {
          formData.append("currentPassword", verifiedGuestPassword);
        }
        await updatePost(category, formData);
      }

      clearPostCache(category);
    } catch (error: any) {
      alert(error?.message || "게시글을 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }

    if (postId) {
      router.push(`/${category}/${postId}`);
    }
  };

  if (mode === "edit" && !post) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 mx-auto pt-8 sm:pb-10">
        <h1 className="text-xl font-bold ml-5 sm:ml-0 sm:mb-5">
          {mode === "add" ? "글쓰기" : "글 수정"}
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          {mode === "edit" && idx && (
            <input type="hidden" name="idx" value={idx} />
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              제목
            </label>
            <Input
              name="title"
              type="text"
              required
              placeholder="제목을 입력해 주세요"
              className="w-full p-2 border rounded-lg"
              value={title}
              onChange={handleTitleChange}
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
                  placeholder="닉네임을 입력해 주세요"
                  className="w-full px-2 py-1.5 border rounded-lg"
                  value={nickname}
                  onChange={handleNicknameChange}
                  autoComplete="off"
                />
              )}
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                비밀번호
                <span className="text-xs ml-1">
                  (익명 글 수정·삭제 시 필요)
                </span>
              </label>
              {user ? (
                <div className="px-2 py-1.5 border rounded-lg text-gray-500 bg-gray-200">
                  &nbsp;
                </div>
              ) : (
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력해 주세요"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-2 py-1.5 border rounded-lg"
                  required={mode === "edit"}
                  autoComplete="off"
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
                placeholder="내용을 입력해 주세요"
                required
                value={content}
                onChange={handleContentChange}
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
                  {mode === "add" ? "등록 중..." : "저장 중..."}
                  <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </>
              ) : mode === "add" ? (
                "등록"
              ) : (
                "저장"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
