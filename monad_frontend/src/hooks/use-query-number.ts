"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const useQueryNumber = (key: string, defaultValue: number) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get(key);
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN;
  const currentValue = Number.isFinite(parsed) ? parsed : defaultValue;

  const setValue = useCallback(
    (nextValue: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!Number.isFinite(nextValue) || nextValue <= 0) {
        params.delete(key);
      } else {
        params.set(key, String(nextValue));
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [key, pathname, router, searchParams]
  );

  return [currentValue, setValue] as const;
};
