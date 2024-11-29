"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MenuLinks, UserLink } from "./menuLinks";
import { getUser } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData: any = await getUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, [pathname]);
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  const handleSearchSubmit = () => {
    if (searchQuery.trim() === "") {
      alert("검색어를 입력해주세요.");
      return;
    }
    router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
  };
  return (
    <>
      <header className="flex items-center justify-between fixed top-0 w-full bg-white z-50 h-14 shadow-md px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold flex flex-row gap-2 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            🍀 코딩테라스
          </Link>
          <div className="hidden sm:flex gap-5">
            <MenuLinks />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="text-gray-700 hover:text-green-500 transition"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>
          <div className="hidden sm:block">
            <UserLink user={user} />
          </div>
          <button
            className="text-xl block sm:hidden"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          >
            ☰
          </button>
        </div>
      </header>
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-lg z-40 transform transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "150px" }}
      >
        <button className="p-4 text-2xl" onClick={closeDrawer}>
          ✕
        </button>
        <div className="flex flex-col p-6 gap-4">
          <MenuLinks />
          <UserLink user={user} />
        </div>
      </div>
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={closeDrawer}
        />
      )}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white w-[95%] max-w-md p-8 rounded-xl shadow-xl relative mx-4 sm:mx-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ top: "20%", position: "absolute" }}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setIsSearchOpen(false)}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-center text-gray-800 mb-6">
              게시글 검색
            </h2>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="제목이나 내용을 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="w-full text-sm pl-10 pr-20 py-2 ring-1 ring-gray-300 focus:ring-2 focus:ring-green-600 focus:ring-offset-0 outline-none rounded-lg"
              />
              <button
                onClick={handleSearchSubmit}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-400 text-white px-3 py-0.5 rounded-lg hover:bg-green-500 transition"
              >
                검색
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
