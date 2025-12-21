import React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

interface Props {
  size?: number;
}

export function WorkingPersonIllustration({ size = 100 }: Props) {
  // Original viewBox is 358.333 x 718.635, we'll use a square crop focusing on the phone
  const aspectRatio = 358.333 / 718.635;
  const width = size;
  const height = size / aspectRatio;
  
  return (
    <Svg width={width} height={height * 0.6} viewBox="0 0 358.333 430">
      <G transform="translate(-783.85 -181)">
        <G transform="translate(783.85 181)">
          {/* Phone frame */}
          <Path d="M624.7,249.968h-3.952V141.8a62.6,62.6,0,0,0-62.6-62.6H328.97a62.6,62.6,0,0,0-62.6,62.6V735.225a62.6,62.6,0,0,0,62.6,62.6H558.143a62.6,62.6,0,0,0,62.6-62.6V326.965H624.7Z" transform="translate(-266.365 -79.193)" fill="#090814"/>
          {/* Phone screen */}
          <Path d="M560.888,95.686H530.974a22.212,22.212,0,0,1-20.565,30.6h-131.3a22.212,22.212,0,0,1-20.566-30.6H330.607a46.752,46.752,0,0,0-46.752,46.752V735a46.752,46.752,0,0,0,46.752,46.752H560.879A46.752,46.752,0,0,0,607.63,735V142.439a46.752,46.752,0,0,0-46.744-46.752Z" transform="translate(-266.577 -79.397)" fill="#fff"/>
        </G>
        
        {/* First task card - completed */}
        <G transform="translate(0 36)">
          <Path d="M8,0H256a8,8,0,0,1,8,8V72a8,8,0,0,1-8,8H8a8,8,0,0,1-8-8V8A8,8,0,0,1,8,0Z" transform="translate(828 292)" fill="#f2f2f2"/>
          <G transform="translate(16 27.557)">
            <Circle cx="24" cy="24" r="24" transform="translate(828 283.137)" fill="#f59e0b"/>
            <Path d="M427.208,515.748a2.49,2.49,0,0,1-1.5-.5l-.027-.02-5.64-4.318a2.506,2.506,0,0,1,3.048-3.978l3.653,2.8,8.633-11.259a2.506,2.506,0,0,1,3.513-.464l-.054.073.055-.072a2.509,2.509,0,0,1,.464,3.513L429.2,514.77a2.507,2.507,0,0,1-1.994.978Z" transform="translate(422.414 -199.457)" fill="#fff"/>
          </G>
          <Path d="M4,0H160a4,4,0,0,1,0,8H4A4,4,0,0,1,4,0Z" transform="translate(904 323)" fill="#090814"/>
          <Path d="M4,0H96a4,4,0,0,1,0,8H4A4,4,0,0,1,4,0Z" transform="translate(904 339)" fill="#090814"/>
          <Path d="M8,1A7.008,7.008,0,0,0,1,8V72a7.008,7.008,0,0,0,7,7H256a7.008,7.008,0,0,0,7-7V8a7.008,7.008,0,0,0-7-7H8M8,0H256a8,8,0,0,1,8,8V72a8,8,0,0,1-8,8H8a8,8,0,0,1-8-8V8A8,8,0,0,1,8,0Z" transform="translate(828 292)" fill="#707070"/>
        </G>
        
        {/* Second task card - pending */}
        <Path d="M8,0H256a8,8,0,0,1,8,8V72a8,8,0,0,1-8,8H8a8,8,0,0,1-8-8V8A8,8,0,0,1,8,0Z" transform="translate(828 432)" fill="#fff"/>
        <Circle cx="24" cy="24" r="24" transform="translate(844 450.693)" fill="#e6e6e6"/>
        <Path d="M4,0H160a4,4,0,0,1,0,8H4A4,4,0,0,1,4,0Z" transform="translate(904 463)" fill="#f2f2f2"/>
        <Path d="M4,0H96a4,4,0,0,1,0,8H4A4,4,0,0,1,4,0Z" transform="translate(904 479)" fill="#f2f2f2"/>
        <Path d="M8,1A7.008,7.008,0,0,0,1,8V72a7.008,7.008,0,0,0,7,7H256a7.008,7.008,0,0,0,7-7V8a7.008,7.008,0,0,0-7-7H8M8,0H256a8,8,0,0,1,8,8V72a8,8,0,0,1-8,8H8a8,8,0,0,1-8-8V8A8,8,0,0,1,8,0Z" transform="translate(828 432)" fill="#707070"/>
        
        {/* Tab buttons */}
        <Rect width="88" height="32" rx="16" transform="translate(828 259)" fill="#f59e0b"/>
        <Rect width="32" height="32" rx="16" transform="translate(1060 259)" fill="#e6e6e6"/>
      </G>
    </Svg>
  );
}
