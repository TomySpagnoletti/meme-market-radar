import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (_?: MediaQueryListEvent) => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    // Support older browsers that only implement addListener/removeListener
    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange);
    } else {
      type LegacyMql = MediaQueryList & {
        addListener?: (listener: (ev: MediaQueryListEvent) => void) => void;
        removeListener?: (listener: (ev: MediaQueryListEvent) => void) => void;
      };
      const legacy = mql as LegacyMql;
      legacy.addListener?.(onChange);
    }
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => {
      if ("removeEventListener" in mql) {
        mql.removeEventListener("change", onChange);
      } else {
        const legacy = mql as {
          removeListener?: (listener: (ev: MediaQueryListEvent) => void) => void;
        };
        legacy.removeListener?.(onChange);
      }
    };
  }, []);

  return !!isMobile;
}
