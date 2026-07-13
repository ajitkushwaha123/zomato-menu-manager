import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

const Error = ({ error, retry }) => {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <UtensilsCrossed className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load</h3>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
        <Button onClick={() => retry()} className="mt-6" variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default Error;
