import { Breadcrumbs } from "./breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useParams, useSearchParams, usePathname } from "next/navigation";

export function SiteHeader() {
  const { resId } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const platform =
    searchParams?.get("platform") ||
    (pathname?.includes("/zomato") ? "zomato" : "swiggy");
  const isHiddenSidebar =
    typeof window !== "undefined" &&
    window.location.search.includes("hideSidebar=true");

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) drag-region">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {!isHiddenSidebar && (
          <>
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
          </>
        )}
        <Breadcrumbs />
      </div>
    </header>
  );
}
