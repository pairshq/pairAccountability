import { useState, useEffect } from "react";
import { useWindowDimensions, Platform } from "react-native";

export function useResponsive() {
  const { width } = useWindowDimensions();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Desktop breakpoint: 1024px and above
    // Tablet breakpoint: 768px - 1023px
    // Mobile breakpoint: below 768px
    setIsDesktop(width >= 1024 || Platform.OS === "web");
    setIsTablet(width >= 768 && width < 1024);
    setIsMobile(width < 768);
  }, [width]);

  return {
    isDesktop,
    isTablet,
    isMobile,
    width,
  };
}



