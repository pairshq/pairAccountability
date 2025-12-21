import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward,
  Settings,
  X,
  Volume2,
  VolumeX,
  Coffee,
  Brain,
  Zap,
  Maximize2,
  Minimize2,
  CloudRain,
  Snowflake,
  Sun,
  Moon,
  Palette,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useResponsive } from "@/hooks/useResponsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";
import { useFocusModeStore } from "@/stores/focusModeStore";

const STORAGE_KEY = "@pair_focus_timer_settings";

type TimerMode = "focus" | "shortBreak" | "longBreak";

type WeatherEffect = "none" | "rain" | "snow";
type ThemeColor = "gold" | "purple" | "blue" | "green" | "pink" | "orange";

interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  maxSessions: number;
  weatherEffect: WeatherEffect;
  themeColor: ThemeColor;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  soundEnabled: true,
  vibrationEnabled: true,
  maxSessions: 4,
  weatherEffect: "none",
  themeColor: "gold",
};

// Theme color configurations
const THEME_COLORS: Record<ThemeColor, { primary: string; secondary: string; name: string }> = {
  gold: { primary: "#FAB300", secondary: "#FFF8E7", name: "Gold" },
  purple: { primary: "#9B59B6", secondary: "#F3E5F5", name: "Purple" },
  blue: { primary: "#3498DB", secondary: "#E3F2FD", name: "Blue" },
  green: { primary: "#2ECC71", secondary: "#E8F5E9", name: "Green" },
  pink: { primary: "#E91E63", secondary: "#FCE4EC", name: "Pink" },
  orange: { primary: "#FF5722", secondary: "#FBE9E7", name: "Orange" },
};

// Rain drop component
const RainDrop = ({ delay, left, duration }: { delay: number; left: number; duration: number }) => {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  
  useEffect(() => {
    const animate = () => {
      fallAnim.setValue(-20);
      Animated.timing(fallAnim, {
        toValue: 800,
        duration: duration,
        useNativeDriver: true,
        delay: delay,
      }).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: `${left}%`,
        width: 2,
        height: 15,
        backgroundColor: "rgba(174, 194, 224, 0.5)",
        borderRadius: 1,
        transform: [{ translateY: fallAnim }],
      }}
    />
  );
};

// Snow flake component
const SnowFlake = ({ delay, left, duration }: { delay: number; left: number; duration: number }) => {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animateFall = () => {
      fallAnim.setValue(-20);
      Animated.timing(fallAnim, {
        toValue: 800,
        duration: duration,
        useNativeDriver: true,
        delay: delay,
      }).start(() => animateFall());
    };
    
    const animateSway = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: -10,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    animateFall();
    animateSway();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: `${left}%`,
        width: 8,
        height: 8,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 4,
        transform: [{ translateY: fallAnim }, { translateX: swayAnim }],
      }}
    />
  );
};

// Weather effects component
const WeatherEffects = ({ effect }: { effect: WeatherEffect }) => {
  if (effect === "none") return null;
  
  const particles = Array.from({ length: effect === "rain" ? 50 : 30 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2000,
    duration: effect === "rain" ? 1000 + Math.random() * 500 : 3000 + Math.random() * 2000,
  }));

  return (
    <View style={styles.weatherContainer} pointerEvents="none">
      {particles.map((p) =>
        effect === "rain" ? (
          <RainDrop key={p.id} left={p.left} delay={p.delay} duration={p.duration} />
        ) : (
          <SnowFlake key={p.id} left={p.left} delay={p.delay} duration={p.duration} />
        )
      )}
    </View>
  );
};

const MODE_CONFIG = {
  focus: { label: "Focus", icon: Brain, color: "#FAB300" },
  shortBreak: { label: "Short Break", icon: Coffee, color: "#2ECC71" },
  longBreak: { label: "Long Break", icon: Zap, color: "#9B59B6" },
};

export default function FocusTimerScreen() {
  const colors = useColors();
  const { isDesktop } = useResponsive();
  
  // Timer state
  const [currentMode, setCurrentMode] = useState<TimerMode>("focus");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  
  // Settings state
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  
  // Fullscreen state from store (to hide sidebar)
  const isFullscreen = useFocusModeStore((state) => state.isFullscreen);
  const setFullscreen = useFocusModeStore((state) => state.setFullscreen);
  
  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update time when mode or settings change
  useEffect(() => {
    if (!isRunning) {
      const duration = getDurationForMode(currentMode);
      setTimeRemaining(duration * 60);
    }
  }, [currentMode, settings]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Pulse animation while running
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      pulseAnim.setValue(1);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  // Update progress animation
  useEffect(() => {
    const totalDuration = getDurationForMode(currentMode) * 60;
    const progress = (totalDuration - timeRemaining) / totalDuration;
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining, currentMode]);

  const getDurationForMode = (mode: TimerMode): number => {
    switch (mode) {
      case "focus":
        return settings.focusDuration;
      case "shortBreak":
        return settings.shortBreakDuration;
      case "longBreak":
        return settings.longBreakDuration;
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (newSettings: TimerSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Play completion sound
  const playCompletionSound = async () => {
    if (!settings.soundEnabled) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
        { shouldPlay: true, volume: 0.8 }
      );
      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    // Sound notification
    playCompletionSound();
    
    // Vibration feedback
    if (settings.vibrationEnabled && Platform.OS !== "web") {
      Vibration.vibrate([0, 500, 200, 500]);
    }

    // Move to next mode
    if (currentMode === "focus") {
      if (sessionCount >= settings.maxSessions) {
        setCurrentMode("longBreak");
        setSessionCount(1);
      } else {
        setCurrentMode("shortBreak");
        setSessionCount((prev) => prev + 1);
      }
    } else {
      setCurrentMode("focus");
    }
  }, [currentMode, sessionCount, settings.vibrationEnabled, settings.maxSessions]);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const duration = getDurationForMode(currentMode);
    setTimeRemaining(duration * 60);
  };

  const skipTimer = () => {
    handleTimerComplete();
  };

  const selectMode = (mode: TimerMode) => {
    if (isRunning) return;
    setCurrentMode(mode);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const modeConfig = MODE_CONFIG[currentMode];
  const totalDuration = getDurationForMode(currentMode) * 60;
  const progress = (totalDuration - timeRemaining) / totalDuration;

  // Progress ring calculations
  const size = isFullscreen ? 340 : isDesktop ? 320 : 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Get theme color based on settings (needed for fullscreen too)
  const themeColor = THEME_COLORS[settings.themeColor]?.primary || THEME_COLORS.gold.primary;

  // Fullscreen mode - only show timer section
  if (isFullscreen) {
    return (
      <View style={[styles.fullscreenContainer, { backgroundColor: colors.background }]}>
        {/* Weather Effects in Fullscreen */}
        <WeatherEffects effect={settings.weatherEffect} />

        {/* Exit fullscreen button */}
        <TouchableOpacity
          style={[styles.exitFullscreenBtn, { zIndex: 10 }]}
          onPress={() => setFullscreen(false)}
        >
          <Minimize2 size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Mode Selector */}
        <View style={styles.fullscreenModeSelector}>
          {(Object.keys(MODE_CONFIG) as TimerMode[]).map((mode) => {
            const config = MODE_CONFIG[mode];
            const isActive = currentMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeBtn,
                  { 
                    backgroundColor: isActive ? `${config.color}20` : "transparent",
                    borderColor: isActive ? config.color : colors.border,
                  },
                ]}
                onPress={() => selectMode(mode)}
                disabled={isRunning}
              >
                <config.icon size={16} color={isActive ? config.color : colors.textSecondary} />
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: isActive ? config.color : colors.textSecondary },
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Timer Display */}
        <View style={styles.fullscreenTimerContainer}>
          <Animated.View style={[styles.timerRing, { transform: [{ scale: pulseAnim }] }]}>
            <Svg width={size} height={size} style={styles.progressSvg}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.border}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={modeConfig.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            
            <View style={styles.timerContent}>
              <Text style={[styles.fullscreenTimerText, { color: colors.text }]}>
                {formatTime(timeRemaining)}
              </Text>
              <Text style={[styles.modeLabel, { color: modeConfig.color }]}>
                {modeConfig.label}
              </Text>
              {currentMode === "focus" && (
                <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
                  Session {sessionCount} of {settings.maxSessions}
                </Text>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Controls */}
        <View style={styles.fullscreenControls}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: colors.card }]}
            onPress={resetTimer}
          >
            <RotateCcw size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              styles.primaryBtn,
              { backgroundColor: modeConfig.color },
            ]}
            onPress={toggleTimer}
          >
            {isRunning ? (
              <Pause size={32} color="#FFFFFF" />
            ) : (
              <Play size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: colors.card }]}
            onPress={skipTimer}
          >
            <SkipForward size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Session Progress */}
        <View style={styles.fullscreenSessionProgress}>
          {Array.from({ length: settings.maxSessions }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.sessionDot,
                {
                  backgroundColor:
                    index < sessionCount - 1 || (index === sessionCount - 1 && currentMode !== "focus")
                      ? modeConfig.color
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Weather Effects */}
      <WeatherEffects effect={settings.weatherEffect} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Focus Timer</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Stay productive
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.card }]}
            onPress={() => setFullscreen(true)}
          >
            <Maximize2 size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.card }]}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        {(Object.keys(MODE_CONFIG) as TimerMode[]).map((mode) => {
          const config = MODE_CONFIG[mode];
          const isActive = currentMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeBtn,
                { 
                  backgroundColor: isActive ? `${config.color}20` : colors.card,
                  borderColor: isActive ? config.color : colors.border,
                },
              ]}
              onPress={() => selectMode(mode)}
              disabled={isRunning}
            >
              <config.icon size={16} color={isActive ? config.color : colors.textSecondary} />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: isActive ? config.color : colors.textSecondary },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View style={[styles.timerRing, { transform: [{ scale: pulseAnim }] }]}>
          <Svg width={size} height={size} style={styles.progressSvg}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={modeConfig.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          
          <View style={styles.timerContent}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              {formatTime(timeRemaining)}
            </Text>
            <Text style={[styles.modeLabel, { color: modeConfig.color }]}>
              {modeConfig.label}
            </Text>
            {currentMode === "focus" && (
              <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
                Session {sessionCount} of {settings.maxSessions}
              </Text>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: colors.card }]}
          onPress={resetTimer}
        >
          <RotateCcw size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlBtn,
            styles.primaryBtn,
            { backgroundColor: modeConfig.color },
          ]}
          onPress={toggleTimer}
        >
          {isRunning ? (
            <Pause size={32} color="#FFFFFF" />
          ) : (
            <Play size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: colors.card }]}
          onPress={skipTimer}
        >
          <SkipForward size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Session Progress */}
      <View style={styles.sessionProgress}>
        {Array.from({ length: settings.maxSessions }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.sessionDot,
              {
                backgroundColor:
                  index < sessionCount - 1 || (index === sessionCount - 1 && currentMode !== "focus")
                    ? modeConfig.color
                    : colors.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Settings Modal */}
      {showSettings && (
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsModal, { backgroundColor: colors.card }]}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsContent}>
              {/* Focus Duration */}
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Focus Duration</Text>
                <View style={styles.durationControl}>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.focusDuration > 5) {
                        saveSettings({ ...settings, focusDuration: settings.focusDuration - 5 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.durationValue, { color: colors.text }]}>
                    {settings.focusDuration} min
                  </Text>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.focusDuration < 60) {
                        saveSettings({ ...settings, focusDuration: settings.focusDuration + 5 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Short Break Duration */}
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Short Break</Text>
                <View style={styles.durationControl}>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.shortBreakDuration > 1) {
                        saveSettings({ ...settings, shortBreakDuration: settings.shortBreakDuration - 1 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.durationValue, { color: colors.text }]}>
                    {settings.shortBreakDuration} min
                  </Text>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.shortBreakDuration < 15) {
                        saveSettings({ ...settings, shortBreakDuration: settings.shortBreakDuration + 1 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Long Break Duration */}
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Long Break</Text>
                <View style={styles.durationControl}>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.longBreakDuration > 5) {
                        saveSettings({ ...settings, longBreakDuration: settings.longBreakDuration - 5 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.durationValue, { color: colors.text }]}>
                    {settings.longBreakDuration} min
                  </Text>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.longBreakDuration < 30) {
                        saveSettings({ ...settings, longBreakDuration: settings.longBreakDuration + 5 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sessions Count */}
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Sessions</Text>
                <View style={styles.durationControl}>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.maxSessions > 1) {
                        saveSettings({ ...settings, maxSessions: settings.maxSessions - 1 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.durationValue, { color: colors.text }]}>
                    {settings.maxSessions}
                  </Text>
                  <TouchableOpacity
                    style={[styles.durationBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      if (settings.maxSessions < 10) {
                        saveSettings({ ...settings, maxSessions: settings.maxSessions + 1 });
                      }
                    }}
                  >
                    <Text style={[styles.durationBtnText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Vibration Toggle */}
              {Platform.OS !== "web" && (
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Vibration</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      {
                        backgroundColor: settings.vibrationEnabled
                          ? MODE_CONFIG.focus.color
                          : colors.background,
                      },
                    ]}
                    onPress={() => saveSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
                  >
                    {settings.vibrationEnabled ? (
                      <Volume2 size={18} color="#FFFFFF" />
                    ) : (
                      <VolumeX size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Weather Effects */}
              <View style={styles.settingSection}>
                <Text style={[styles.settingSectionTitle, { color: colors.text }]}>Weather Effects</Text>
                <View style={styles.weatherOptions}>
                  <TouchableOpacity
                    style={[
                      styles.weatherOption,
                      { 
                        backgroundColor: settings.weatherEffect === "none" ? themeColor : colors.background,
                        borderColor: settings.weatherEffect === "none" ? themeColor : colors.border,
                      },
                    ]}
                    onPress={() => saveSettings({ ...settings, weatherEffect: "none" })}
                  >
                    <Sun size={20} color={settings.weatherEffect === "none" ? "#FFFFFF" : colors.textSecondary} />
                    <Text style={[styles.weatherOptionText, { color: settings.weatherEffect === "none" ? "#FFFFFF" : colors.text }]}>None</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.weatherOption,
                      { 
                        backgroundColor: settings.weatherEffect === "rain" ? themeColor : colors.background,
                        borderColor: settings.weatherEffect === "rain" ? themeColor : colors.border,
                      },
                    ]}
                    onPress={() => saveSettings({ ...settings, weatherEffect: "rain" })}
                  >
                    <CloudRain size={20} color={settings.weatherEffect === "rain" ? "#FFFFFF" : colors.textSecondary} />
                    <Text style={[styles.weatherOptionText, { color: settings.weatherEffect === "rain" ? "#FFFFFF" : colors.text }]}>Rain</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.weatherOption,
                      { 
                        backgroundColor: settings.weatherEffect === "snow" ? themeColor : colors.background,
                        borderColor: settings.weatherEffect === "snow" ? themeColor : colors.border,
                      },
                    ]}
                    onPress={() => saveSettings({ ...settings, weatherEffect: "snow" })}
                  >
                    <Snowflake size={20} color={settings.weatherEffect === "snow" ? "#FFFFFF" : colors.textSecondary} />
                    <Text style={[styles.weatherOptionText, { color: settings.weatherEffect === "snow" ? "#FFFFFF" : colors.text }]}>Snow</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Theme Colors */}
              <View style={styles.settingSection}>
                <Text style={[styles.settingSectionTitle, { color: colors.text }]}>Theme Color</Text>
                <View style={styles.themeColorOptions}>
                  {(Object.keys(THEME_COLORS) as ThemeColor[]).map((colorKey) => {
                    const colorConfig = THEME_COLORS[colorKey];
                    const isSelected = settings.themeColor === colorKey;
                    return (
                      <TouchableOpacity
                        key={colorKey}
                        style={[
                          styles.themeColorOption,
                          { 
                            backgroundColor: colorConfig.primary,
                            borderWidth: isSelected ? 3 : 0,
                            borderColor: colors.text,
                          },
                        ]}
                        onPress={() => saveSettings({ ...settings, themeColor: colorKey })}
                      >
                        {isSelected && (
                          <View style={styles.themeColorCheck}>
                            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderBottomWidth: 1,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  timerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  timerRing: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  progressSvg: {
    position: "absolute",
  },
  timerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 64,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
  },
  modeLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  sessionText: {
    fontSize: 14,
    marginTop: 4,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 30,
  },
  controlBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  primaryBtn: {
    width: 80,
    height: 80,
  },
  secondaryBtn: {
    width: 56,
    height: 56,
  },
  sessionProgress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 40,
  },
  sessionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  settingsModal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  settingsContent: {
    gap: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  durationControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  durationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  durationBtnText: {
    fontSize: 20,
    fontWeight: "600",
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "center",
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  exitFullscreenBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenModeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    position: "absolute",
    top: 40,
  },
  fullscreenTimerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenTimerText: {
    fontSize: 72,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
  },
  fullscreenControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    position: "absolute",
    bottom: 120,
  },
  fullscreenSessionProgress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    position: "absolute",
    bottom: 60,
  },
  // Weather Effects Styles
  weatherContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 1,
  },
  // Settings Section Styles
  settingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  settingSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weatherOptions: {
    flexDirection: "row",
    gap: 10,
  },
  weatherOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  weatherOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  themeColorOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  themeColorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  themeColorCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
