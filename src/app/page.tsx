"use client";

import React from "react";
import { useMusic } from "@/context/MusicContext";
import { Navbar } from "@/components/Navbar";
import { SongList } from "@/components/SongList";
import { SetlistViewer } from "@/components/SetlistViewer";

export default function Home() {
  const { viewMode } = useMusic();

  if (viewMode === "viewer") {
    return <SetlistViewer />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#121212] transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <SongList />
      </main>
    </div>
  );
}

