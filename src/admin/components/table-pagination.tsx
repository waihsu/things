import { Button } from "@/src/admin/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/admin/components/ui/select";
import { cn } from "@/src/admin/lib/utils";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const to = totalItems ? Math.min(safePage * pageSize, totalItems) : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Showing {from}-{to} of {totalItems} | Page {safePage} / {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent align="end">
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
