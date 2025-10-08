"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type NavigationEvent = React.MouseEvent<HTMLElement>;

const shouldLetBrowserHandle = (event: NavigationEvent) => {
  return (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
};

export function useNavigationLoader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
    }
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      setIsNavigating(true);
      router.push(href);
    },
    [router]
  );

  const handleNavigation = useCallback(
    (event: NavigationEvent, href: string) => {
      if (shouldLetBrowserHandle(event)) {
        return false;
      }

      event.preventDefault();
      navigate(href);
      return true;
    },
    [navigate]
  );

  return { isNavigating, handleNavigation, navigate };
}

export type UseNavigationLoaderReturn = ReturnType<typeof useNavigationLoader>;
