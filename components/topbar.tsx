"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getUser } from "@/app/actions";
import { MenuLinks, UserLink } from "./menuLinks";

export default function TopBar() {
  const [isOverflow, setIsOverflow] = useState(false);
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    async function fetchUser() {
      const userData: any = await getUser();
      setUser(userData);
    }
    fetchUser();
    setTimeout(checkOverflow, 0);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    checkOverflow();
  }, [user]);
  const checkOverflow = () => {
    const menuItems = menuRef.current?.querySelectorAll("a");
    let isTextOverflow = false;
    if (menuItems) {
      menuItems.forEach((item) => {
        if (item.scrollWidth > item.clientWidth) {
          isTextOverflow = true;
        }
      });
    }
    setIsOverflow(isTextOverflow);
  };
  const handleResize = () => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      checkOverflow();
    }, 300);
  };
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  return (
    <>
      <header
        ref={containerRef}
        className="flex items-center justify-between fixed top-0 w-full bg-white z-50 h-14 shadow-md px-6"
      >
        <div ref={menuRef} className="flex items-center gap-6 overflow-hidden">
          <Link
            href="/"
            className="text-lg font-bold flex flex-row gap-2 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            🍀 코딩테라스
          </Link>
          {!isOverflow && <MenuLinks />}
        </div>
        <div className="flex items-center">
          {isOverflow ? (
            <button
              className="text-xl"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            >
              ☰
            </button>
          ) : (
            <UserLink user={user} />
          )}
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
