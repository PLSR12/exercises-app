import { StatusBar } from "expo-status-bar";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { DashboardScreen, TrainScreen } from "./src/screens";
import { TrainingContext } from "./src/types/training";

const getNextContextName = (current: TrainingContext[]): TrainingContext => {
  const used = new Set(current);
  let idx = current.length;
  let name = String.fromCharCode(65 + idx);
  while (used.has(name) && idx < 26) {
    idx += 1;
    name = String.fromCharCode(65 + idx);
  }
  if (!used.has(name)) return name;

  let num = idx + 1;
  while (used.has(`Treino ${num}`)) {
    num += 1;
  }
  return `Treino ${num}`;
};

export default function App() {
  type Tab = "dashboard" | TrainingContext;
  const defaultContexts: TrainingContext[] = ["A", "B", "C"];
  const [tab, setTab] = React.useState<Tab>("dashboard");
  const [contexts, setContexts] =
    React.useState<TrainingContext[]>(defaultContexts);

  React.useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("training-contexts");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length) {
            setContexts(parsed);
            if (!parsed.includes(tab as string)) {
              setTab("dashboard");
            }
            return;
          }
        }
      } catch (error) {
        console.warn("Erro ao carregar abas", error);
      }
      setContexts(defaultContexts);
    };
    load();
  }, []);

  React.useEffect(() => {
    AsyncStorage.setItem("training-contexts", JSON.stringify(contexts)).catch(
      (error) => console.warn("Erro ao salvar abas", error),
    );
  }, [contexts]);

  React.useEffect(() => {
    if (tab !== "dashboard" && !contexts.includes(tab)) {
      setTab("dashboard");
    }
  }, [contexts, tab]);

  const addContext = React.useCallback(() => {
    const name = getNextContextName(contexts);
    setContexts((prev) => [...prev, name]);
    setTab(name);
  }, [contexts]);

  const removeContext = React.useCallback(
    (ctx: TrainingContext) => {
      setContexts((prev) => prev.filter((item) => item !== ctx));
      if (tab === ctx) {
        setTab("dashboard");
      }
      AsyncStorage.removeItem(`trains-${ctx}`).catch((error) =>
        console.warn("Erro ao remover treino", error),
      );
    },
    [tab],
  );

  const confirmRemoveContext = React.useCallback(
    (ctx: TrainingContext) => {
      Alert.alert("Remover treino", `Deseja remover o treino ${ctx}?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeContext(ctx),
        },
      ]);
    },
    [removeContext],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Meus treinos</Text>
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setTab("dashboard")}
            style={[
              styles.tabButton,
              tab === "dashboard" && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "dashboard" && styles.tabTextActive,
              ]}
            >
              Dashboard
            </Text>
          </Pressable>
          {contexts.map((item) => {
            const active = tab === item;
            return (
              <View key={item} style={styles.tabWrapper}>
                <Pressable
                  onPress={() => setTab(item)}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    Treino {item}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.tabClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => confirmRemoveContext(item)}
                >
                  <Text
                    style={[
                      styles.tabCloseText,
                      active && styles.tabTextActive,
                    ]}
                  >
                    ×
                  </Text>
                </Pressable>
              </View>
            );
          })}
          <Pressable onPress={addContext} style={styles.tabButton}>
            <Text style={styles.tabText}>+ Novo</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {tab === "dashboard" ? (
          <DashboardScreen contexts={contexts} />
        ) : (
          <TrainScreen context={tab} />
        )}
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
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tabWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
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
  tabClose: {
    marginLeft: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  tabCloseText: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
});
