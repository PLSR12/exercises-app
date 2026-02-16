import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { TrainScreen } from "./src/screens/Trains";
import { TrainingContext } from "./src/types/training";

export default function App() {
  const [tab, setTab] = React.useState<TrainingContext>("A");
  const tabs: TrainingContext[] = ["A", "B", "C"];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Meus treinos</Text>
        <View style={styles.tabRow}>
          {tabs.map((item) => {
            const active = tab === item;
            return (
              <Pressable
                key={item}
                onPress={() => setTab(item)}
                style={[styles.tabButton, active && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  Treino {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.content}>
        <TrainScreen context={tab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#f5f7fb",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  tabButtonActive: {
    backgroundColor: "#0f62fe",
  },
  tabText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
