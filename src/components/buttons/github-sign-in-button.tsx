"use client";

import { Github, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface GitHubSignInButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function GitHubSignInButton({ callbackUrl = "/", className }: GitHubSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await signIn("github", { callbackUrl });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={() => void handleClick()}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Github className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Redirecting..." : "Sign in with GitHub"}
    </Button>
  );
}
