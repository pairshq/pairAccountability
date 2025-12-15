import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { MessageSquare, CheckCircle2, Flame, Users, Target, ArrowUp, Lightbulb } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

// Network connection lines
const NetworkLines = () => (
  <Svg
    width={width}
    height={height}
    style={StyleSheet.absoluteFill}
    opacity={0.2}
  >
    {/* Connection arcs and lines */}
    <Path
      d="M 80 150 Q 150 100 220 150"
      fill="none"
      stroke="#6B6B6B"
      strokeWidth="1"
    />
    <Path
      d="M 300 120 Q 350 80 400 120"
      fill="none"
      stroke="#6B6B6B"
      strokeWidth="1"
    />
    <Line x1="100" y1="200" x2="200" y2="180" stroke="#6B6B6B" strokeWidth="1" />
    <Line x1="350" y1="250" x2="280" y2="220" stroke="#6B6B6B" strokeWidth="1" />
  </Svg>
);

// Floating network element component
const NetworkElement = ({
  x,
  y,
  icon: Icon,
  label,
  color = "#6B6B6B",
}: {
  x: number;
  y: number;
  icon: any;
  label?: string;
  color?: string;
}) => (
  <View style={[styles.networkElement, { left: x, top: y }]}>
    <View style={[styles.networkIconContainer, { backgroundColor: color + "15" }]}>
      <Icon size={20} color={color} strokeWidth={2} />
    </View>
    {label && (
      <Text style={[styles.networkLabel, { color }]}>{label}</Text>
    )}
  </View>
);

// Avatar component
const Avatar = ({ x, y, color }: { x: number; y: number; color: string }) => (
  <View style={[styles.avatar, { left: x, top: y, backgroundColor: color }]} />
);

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Network background elements */}
        <NetworkLines />

        {/* Network elements positioned around */}
        {/* Left side elements */}
        <NetworkElement x={width * 0.1} y={height * 0.15} icon={MessageSquare} label="💬 12" color="#4285F4" />
        <NetworkElement x={width * 0.15} y={height * 0.35} icon={CheckCircle2} label="✔ Answer" color="#2ECC71" />
        <NetworkElement x={width * 0.12} y={height * 0.55} icon={Flame} label="🔥 8" color="#FAB300" />
        <NetworkElement x={width * 0.18} y={height * 0.7} icon={Users} label="👥 5" color="#9B59B6" />

        {/* Right side elements */}
        <NetworkElement x={width * 0.75} y={height * 0.2} icon={Target} label="✓ Goal" color="#2ECC71" />
        <NetworkElement x={width * 0.8} y={height * 0.4} icon={MessageSquare} label="💬 24" color="#4285F4" />
        <NetworkElement x={width * 0.78} y={height * 0.6} icon={ArrowUp} label="↑ 15" color="#E74C3C" />
        <NetworkElement x={width * 0.82} y={height * 0.75} icon={Lightbulb} label="💡 3" color="#FAB300" />

        {/* Avatars scattered around */}
        <Avatar x={width * 0.08} y={height * 0.25} color="#FF6B6B" />
        <Avatar x={width * 0.2} y={height * 0.5} color="#4ECDC4" />
        <Avatar x={width * 0.72} y={height * 0.3} color="#95E1D3" />
        <Avatar x={width * 0.85} y={height * 0.65} color="#F38181" />

        {/* Central Content */}
        <View style={styles.centralContent}>
          {/* Product Name */}
          <Text style={styles.productName}>Pair Accountability</Text>

          {/* Main Headline */}
          <Text style={styles.headline}>The home for accountability partners</Text>

          {/* Description */}
          <Text style={styles.description}>
            Set goals, track progress, and build consistency with each other - all in one place. 
            Pair enables healthy and productive accountability through shared commitments and supportive check-ins.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/(auth)/signup")}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Get started</Text>
              <Text style={styles.arrow}> →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.secondaryLink}
            >
              <Text style={styles.secondaryLinkText}>Sign in →</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom tagline */}
          <Text style={styles.tagline}>Dedicated space for progress together.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  centralContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FAB300",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  description: {
    fontSize: 18,
    fontWeight: "400",
    color: "#6B6B6B",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: 600,
    letterSpacing: -0.3,
  },
  ctaContainer: {
    alignItems: "center",
    marginBottom: 32,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  arrow: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryLink: {
    paddingVertical: 8,
  },
  secondaryLinkText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B6B6B",
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  networkElement: {
    position: "absolute",
    alignItems: "center",
    zIndex: 5,
  },
  networkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  networkLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  avatar: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 5,
  },
});
