"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
}
