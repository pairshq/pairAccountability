import Svg, { Path, Circle, Rect } from "react-native-svg";

interface LogoProps {
  size?: number;
  color?: string;
}

export function Logo({ size = 64, color = "#FFFFFF" }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* P shape */}
      <Path
        d="M 25 20 L 25 80 M 25 20 L 50 20 Q 65 20 65 35 Q 65 50 50 50 L 25 50"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Two dots */}
      <Circle cx="42" cy="68" r="3" fill={color} />
      <Circle cx="52" cy="68" r="3" fill={color} />
    </Svg>
  );
}


