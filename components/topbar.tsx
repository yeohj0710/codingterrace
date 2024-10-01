"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MenuLinks, UserLink } from "./menuLinks";
import { getUser } from "@/lib/auth";

export default function TopBar() {
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  useEffect(() => {
    async function fetchUser() {
      const userData: any = await getUser();
      setUser(userData);
    }
    fetchUser();
  }, []);
  const closeDrawer = () => {
    setIsDrawerOpen(false);
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
          <div className="hidden sm:flex">
            <div className="hidden sm:flex gap-5">
              <MenuLinks />
            </div>
          </div>
        </div>
        <div className="flex items-center">
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
    </>
  );
}
