"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trash2, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import CookieStorage from "@/services/cookie";
import useNotification from "@/store/hooks/useNotification";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [cookie, setCookie] = useState("");
  const [accountName, setAccountName] = useState("");
  const [savedAccounts, setSavedAccounts] = useState([]);
  const notify = useNotification();

  useEffect(() => {
    const savedCookie = CookieStorage.get();
    if (savedCookie) {
      router.replace("/");
    }

    try {
      const stored = localStorage.getItem("zomato_saved_accounts");
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch (e) { }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = cookie.trim();
    if (!value) return;

    if (accountName.trim()) {
      const existing = savedAccounts.filter(a => a.name !== accountName.trim());
      const updated = [{ name: accountName.trim(), cookie: value }, ...existing];
      setSavedAccounts(updated);
      localStorage.setItem("zomato_saved_accounts", JSON.stringify(updated));
    }

    CookieStorage.set(value);
    notify.success("Logged In Successfully ...!", { duration: 10000 });
    router.replace("/");
  };

  const removeAccount = (e, name) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(a => a.name !== name);
    setSavedAccounts(updated);
    localStorage.setItem("zomato_saved_accounts", JSON.stringify(updated));
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
        <CardContent className="space-y-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">

            {savedAccounts.length > 0 && (
              <div className="space-y-3 mb-6 bg-muted/20 p-4 rounded-2xl border border-white/10">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Saved Accounts
                </h3>
                <div className="flex flex-wrap gap-2">
                  {savedAccounts.map(acc => (
                    <div
                      key={acc.name}
                      onClick={() => {
                        setAccountName(acc.name);
                        setCookie(acc.cookie);
                      }}
                      className="group flex items-center gap-2 bg-background hover:bg-muted/80 border rounded-full pl-4 pr-1 py-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <span className="text-sm font-medium">{acc.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors ml-1"
                        onClick={(e) => removeAccount(e, acc.name)}
                        title="Remove account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FieldGroup>
              <Field>
                <div className="mb-6">
                  <Input
                    type="text"
                    placeholder="Account Name (optional)"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="h-12 rounded-xl bg-muted/40 font-medium px-4"
                  />
                  <FieldDescription className="mt-2 text-xs opacity-70 px-1">
                    Give this session a name to easily switch to it later.
                  </FieldDescription>
                </div>
              </Field>

              <Field>
                <Textarea
                  rows={12}
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste your Cookie header..."
                  className="
                    min-h-[220px]
                    max-h-[350px]
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

                <FieldDescription className="mt-3 text-sm opacity-80 px-1">
                  Copy the entire{" "}
                  <span className="rounded bg-muted/60 px-2 py-1 font-mono text-primary">
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
              className="group h-14 w-full rounded-2xl text-base font-semibold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
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