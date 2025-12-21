import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

interface PairLoaderProps {
  size?: number;
  color?: string;
}

export function PairLoader({ size = 64, color = "#FFFFFF" }: PairLoaderProps) {
  const dot1Opacity = useRef(new Animated.Value(1)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        // Dot 1 fades out, Dot 2 fades in
        Animated.parallel([
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        // Dot 1 fades in, Dot 2 fades out
        Animated.parallel([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();

    return () => {
      dot1Opacity.stopAnimation();
      dot2Opacity.stopAnimation();
    };
  }, []);

  // Scale factor for positioning
  const scale = size / 100;
  const dotSize = 8 * scale;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* P shape - bigger and bolder */}
        <Path
          d="M 20 10 L 20 90 M 20 10 L 55 10 Q 80 10 80 32.5 Q 80 55 55 55 L 20 55"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      
      {/* Animated dots overlay - bigger and repositioned */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            left: 38 * scale - dotSize / 2,
            top: 75 * scale - dotSize / 2,
            opacity: dot1Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            left: 52 * scale - dotSize / 2,
            top: 75 * scale - dotSize / 2,
            opacity: dot2Opacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  dot: {
    position: "absolute",
  },
});

export default PairLoader;
