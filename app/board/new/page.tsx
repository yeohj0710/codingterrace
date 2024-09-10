"use client";

import Input from "@/components/input";
import { useState } from "react";
import { uploadPost } from "./actions";

export default function AddPost() {
  const [category, setCategory] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await uploadPost(new FormData(e.target));
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="flex flex-col items-center">
      <div className="w-[640px] lg:w-1/2 mx-auto py-10">
        <h1 className="text-xl font-bold mb-5">게시글 작성</h1>
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
          <div className="flex flex-row gap-8 mb-4">
            <div className="w-full">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                카테고리
              </label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="board">자유</option>
              </select>
            </div>
            <div className="w-full">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                비밀번호{" "}
                <label className="text-xs">(비회원 게시글 삭제 시 필요) </label>
              </label>
              <input
                name="password"
                type="password"
                placeholder="비밀번호를 입력해 주세요. (선택)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2 py-1.5 border rounded-lg"
              />
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
