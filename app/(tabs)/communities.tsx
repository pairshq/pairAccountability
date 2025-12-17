import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Globe, Users, Plus, Search } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useResponsive } from "@/hooks/useResponsive";

export default function CommunitiesScreen() {
  const colors = useColors();
  const { user } = useAuthStore();
  const { isDesktop } = useResponsive();
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // TODO: Fetch communities
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}
          >
            <Search size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#FAB300" }]}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
            <Globe size={48} color={colors.textSecondary} strokeWidth={1} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Discover Communities
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Join communities to connect with like-minded people, share progress, and stay accountable together.
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: "#FAB300" }]}
          >
            <Globe size={18} color="#FFFFFF" />
            <Text style={styles.exploreButtonText}>Explore Communities</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Communities Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured</Text>
          <View style={[styles.comingSoonCard, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5", borderColor: colors.border }]}>
            <Users size={24} color={colors.textSecondary} />
            <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
              Communities feature coming soon!
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  comingSoonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  comingSoonText: {
    fontSize: 15,
  },
});
