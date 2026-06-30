"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  Check,
  Store,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import useRestaurant from "@/store/hooks/useRestaurant";
import { useMenu } from "@/store/hooks/useMenu";

function ProjectSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function RestaurantImage({ restaurant }) {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted shadow-sm">
      {restaurant?.thumbnail ? (
        <img
          src={restaurant.thumbnail}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <Store className="size-4 text-muted-foreground" />
      )}
    </div>
  );
}

export function ProjectSwitcher() {
  const { isMobile } = useSidebar();

  const {
    restaurants,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useRestaurant();

  const { activeResId, setActiveResId } = useMenu();

  const [searchQuery, setSearchQuery] = React.useState("");
  
  const entities = restaurants?.entities ?? [];
  const filteredEntities = React.useMemo(() => {
    if (!searchQuery.trim()) return entities;
    return entities.filter(r => 
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.subzone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entities, searchQuery]);

  const selected = React.useMemo(() => {
    return entities.find((r) => r.id === activeResId) || null;
  }, [entities, activeResId]);

  React.useEffect(() => {
    if (!activeResId && entities.length) {
      const savedResId = typeof window !== 'undefined' ? localStorage.getItem('activeResId') : null;
      const matchedEntity = savedResId ? entities.find(e => String(e.id) === savedResId) : null;
      
      if (matchedEntity) {
        setActiveResId(matchedEntity.id);
      } else {
        setActiveResId(entities[0].id);
      }
    }
  }, [entities, activeResId, setActiveResId]);

  if (isLoading) return <ProjectSkeleton />;

  if (isError) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="space-y-3 rounded-xl border border-destructive/10 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 text-destructive shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-destructive">Unable to load restaurants</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-normal">
                  {error?.message || "Something went wrong."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full bg-background hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 h-8 text-xs"
              onClick={refetch}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-2 size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Retry Connection
            </Button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!entities.length) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="rounded-xl border border-dashed p-5 text-center bg-muted/20">
            <Store className="mx-auto mb-2.5 size-6 text-muted-foreground/70" />
            <p className="text-sm font-medium">No Restaurants Found</p>
            <p className="text-muted-foreground mt-1 text-xs max-w-[200px] mx-auto leading-normal">
              We couldn't find any restaurants associated with this account.
            </p>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={(open) => {
            if (!open) setSearchQuery("");
        }}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="
                group
                h-14
                rounded-xl
                border
                bg-background
                shadow-sm
                transition-all duration-200
                hover:border-accent-foreground/10
                hover:bg-accent/50
                data-[state=open]:border-accent-foreground/20
                data-[state=open]:bg-accent
              "
            >
              <RestaurantImage restaurant={selected} />

              <div className="grid min-w-0 flex-1 text-left ml-0.5">
                <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                  {selected?.name || "Select Restaurant"}
                </span>
                <span className="truncate text-xs font-medium text-muted-foreground/80">
                  {selected?.subzone || "No zone selected"}
                </span>
              </div>

              <ChevronsUpDown className="size-4 shrink-0 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={8}
            className="w-[320px] rounded-xl p-1 shadow-lg"
          >
            <DropdownMenuLabel className="px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Your Restaurants
                  </p>
                  <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                    {entities.length} connected account{entities.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <div className="px-2 pb-2">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search restaurant or zone..."
                        className="w-full text-xs bg-muted/50 border-none rounded-md pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        // Prevent the dropdown from closing when typing (radix ui default behavior can sometimes bubble up)
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            <DropdownMenuSeparator className="mx-1" />

            <div className="max-h-[340px] overflow-y-auto space-y-0.5">
              {filteredEntities.length > 0 ? filteredEntities.map((restaurant) => {
                const active = activeResId === restaurant.id;

                return (
                  <DropdownMenuItem
                    key={restaurant.id}
                    onClick={() => setActiveResId(restaurant.id)}
                    className={`
                      flex items-center gap-3
                      cursor-pointer
                      rounded-lg
                      px-2.5
                      py-2
                      transition-colors
                      focus:bg-accent
                      ${active ? "bg-accent text-accent-foreground font-medium" : ""}
                    `}
                  >
                    <RestaurantImage restaurant={restaurant} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {restaurant.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground/80 font-normal">
                        {restaurant.subzone}
                      </p>
                    </div>

                    {active && (
                      <Check className="size-4 text-primary shrink-0 mr-1" />
                    )}
                  </DropdownMenuItem>
                );
              }) : (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No restaurants found matching "{searchQuery}"
                </div>
              )}
            </div>

            <DropdownMenuSeparator className="mx-1" />

            <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium text-muted-foreground/70 bg-muted/30 rounded-b-lg">
              <span>Select context to switch</span>
              <span>{filteredEntities.length} Total</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}