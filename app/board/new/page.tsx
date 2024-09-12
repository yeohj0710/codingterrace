"use client";

import Input from "@/components/input";
import { useEffect, useState } from "react";
import { getUser, uploadPost } from "./actions";

export default function AddPost() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    fetchUser();
  }, []);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await uploadPost(new FormData(e.currentTarget));
    } catch (error) {}
  };
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col w-full sm:w-[640px] lg:w-1/2 mx-auto pt-8 sm:pb-10">
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
