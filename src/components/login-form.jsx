"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import CookieStorage from "@/services/cookie";
import useNotification from "@/store/hooks/useNotification";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [cookie, setCookie] = useState("");
  const notify = useNotification();

  useEffect(() => {
    const savedCookie = CookieStorage.get();
    if (savedCookie) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = cookie.trim();
    if (!value) return;
    CookieStorage.set(value);
    notify.success("Logged In Successfully ...!", { duration: 10000 });
    router.replace("/");
  };

  return (
    <div
      className={cn(
        "relative flex w-full overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background p-10",
        className
      )}
      {...props}
    >
      <Card className="relative w-full overflow-hidden rounded-3xl border-white/20 bg-background/80">
        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <FieldGroup>
              <Field>
                <Textarea
                  rows={12}
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste your Cookie header..."
                  className="
                    min-h-[280px]
                    max-h-[420px]
                    overflow-y-auto
                    resize-none
                    rounded-2xl
                    border
                    bg-muted/40
                    p-5
                    font-mono
                    text-xs
                    leading-6
                    shadow-inner
                    break-all
                  "
                />

                <FieldDescription className="mt-3 text-sm">
                  Copy the entire{" "}
                  <span className="rounded bg-muted px-2 py-1 font-mono">
                    Cookie
                  </span>{" "}
                  request header from your browser's Developer Tools and paste
                  it here.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              size="lg"
              className="group h-14 w-full rounded-2xl text-base font-semibold shadow-lg"
            >
              Connect Session
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}