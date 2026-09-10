import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

function useBreakpoint(maxWidth: number) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);
    const onChange = () => setMatches(window.innerWidth < maxWidth);
    mql.addEventListener("change", onChange);
    setMatches(window.innerWidth < maxWidth);
    return () => mql.removeEventListener("change", onChange);
  }, [maxWidth]);

  return !!matches;
}

export function useIsMobile() {
  return useBreakpoint(MOBILE_BREAKPOINT);
}

/** True below the lg sidebar breakpoint (phone + tablet). */
export function useIsCompact() {
  return useBreakpoint(DESKTOP_BREAKPOINT);
}
