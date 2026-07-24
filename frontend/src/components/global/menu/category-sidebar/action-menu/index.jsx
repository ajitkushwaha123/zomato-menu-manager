import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActionMenu({
    onRename,
    onDelete,
    onCopy,
    destructive = true,
    triggerClassName,
}) {
    const handleTriggerClick = (e) => {
        e.stopPropagation();
    };

    const handleAction = (e, callback) => {
        e.stopPropagation();
        if (callback) callback();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleTriggerClick}>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                        triggerClassName
                    )}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-40 rounded-xl p-1"
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenuItem
                    onClick={(e) => handleAction(e, onRename)}
                    className="cursor-pointer rounded-lg"
                >
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                </DropdownMenuItem>
                
                {onCopy && (
                    <DropdownMenuItem
                        onClick={(e) => handleAction(e, onCopy)}
                        className="cursor-pointer rounded-lg"
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    onClick={(e) => handleAction(e, onDelete)}
                    className={cn(
                        "cursor-pointer rounded-lg",
                        destructive &&
                        "text-destructive focus:bg-destructive/10 focus:text-destructive"
                    )}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}