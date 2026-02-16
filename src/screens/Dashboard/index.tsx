import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Platform,
} from "react-native";
import { TrainingContext, TrainingForm } from "../../types/training";
import { styles } from "./styles";

type TrainingDataMap = Record<string, TrainingForm>;

type ContextSummary = {
  context: TrainingContext;
  exercises: number;
  series: number;
  reps: number;
  volume: number;
};

const emptyData = (ctxs: TrainingContext[]): TrainingDataMap =>
  ctxs.reduce((acc, ctx) => {
    acc[ctx] = { trains: [] };
    return acc;
  }, {} as TrainingDataMap);

interface Props {
  contexts: TrainingContext[];
}

export function DashboardScreen({ contexts }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<TrainingDataMap>(() =>
    emptyData(contexts),
  );
  const [showImport, setShowImport] = React.useState(false);
  const [importText, setImportText] = React.useState("");

  const loadAll = React.useCallback(async () => {
    if (!contexts.length) {
      setData({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const keys = contexts.map((ctx) => `trains-${ctx}`);
      const stored = await AsyncStorage.multiGet(keys);
      const next = emptyData(contexts);

      stored.forEach(([key, value]) => {
        if (!key || !value) return;
        const ctx = key.replace("trains-", "") as TrainingContext;
        if (!contexts.includes(ctx)) return;
        try {
          next[ctx] = JSON.parse(value) as TrainingForm;
        } catch (error) {
          console.warn("Erro ao ler treino", ctx, error);
        }
      });

      setData(next);
    } catch (error) {
      console.warn("Erro ao carregar dashboard", error);
      Alert.alert("Erro", "Nao foi possivel carregar o dashboard");
    } finally {
      setLoading(false);
    }
  }, [contexts]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  React.useEffect(() => {
    setData(emptyData(contexts));
  }, [contexts]);

  const summaries = React.useMemo(() => {
    const perContext: ContextSummary[] = contexts.map((ctx) => {
      const trains = data[ctx]?.trains ?? [];
      const exercises = trains.length;
      const series = trains.reduce((acc, item) => acc + (item.series ?? 0), 0);
      const reps = trains.reduce((acc, item) => acc + (item.reps ?? 0), 0);
      const volume = trains.reduce(
        (acc, item) =>
          acc +
          (item.series ?? 0) * (item.reps ?? 0) * (item.weightActual ?? 0),
        0,
      );

      return { context: ctx, exercises, series, reps, volume };
    });

    const totals = perContext.reduce(
      (acc, item) => {
        acc.exercises += item.exercises;
        acc.series += item.series;
        acc.reps += item.reps;
        acc.volume += item.volume;
        return acc;
      },
      { exercises: 0, series: 0, reps: 0, volume: 0 },
    );

    return { perContext, totals };
  }, [data, contexts]);

  const handleExport = React.useCallback(async () => {
    try {
      const payload = {
        generatedAt: new Date().toISOString(),
        trains: data,
      };

      await Share.share({
        title: "Treinos",
        message: JSON.stringify(payload, null, 2),
      });
    } catch (error) {
      console.warn("Erro ao exportar treinos", error);
      Alert.alert("Erro", "Nao foi possivel exportar os treinos");
    }
  }, [data]);

  const handleImport = React.useCallback(async () => {
    try {
      const parsed = JSON.parse(importText || "{}");
      const source: Partial<TrainingDataMap> = parsed.trains ?? parsed;

      const next = emptyData(contexts);
      contexts.forEach((ctx) => {
        const ctxData = source?.[ctx];
        if (ctxData && Array.isArray(ctxData.trains)) {
          next[ctx] = {
            trains: ctxData.trains.map((item) => ({
              name: item.name ?? "",
              reps: item.reps ?? null,
              series: item.series ?? null,
              weightActual: item.weightActual ?? null,
              weightBefore: item.weightBefore ?? null,
              observations: item.observations ?? "",
            })),
          };
        }
      });

      const entries = contexts.map(
        (ctx) => [`trains-${ctx}`, JSON.stringify(next[ctx])] as const,
      );

      await AsyncStorage.multiSet(entries);
      setData(next);
      setShowImport(false);
      setImportText("");
      Alert.alert("Sucesso", "Treinos importados");
    } catch (error) {
      console.warn("Erro ao importar treinos", error);
      Alert.alert(
        "Erro",
        "JSON invalido. Verifique o formato e tente novamente",
      );
    }
  }, [importText]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Resumo rapido dos treinos</Text>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.primaryCard]}>
          <Text style={[styles.summaryLabel, styles.summaryLabelOnPrimary]}>
            Exercicios
          </Text>
          <Text style={[styles.summaryValue, styles.summaryValueOnPrimary]}>
            {summaries.totals.exercises}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Series</Text>
          <Text style={styles.summaryValue}>{summaries.totals.series}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Repeticoes</Text>
          <Text style={styles.summaryValue}>{summaries.totals.reps}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Carga estimada</Text>
          <Text style={styles.summaryValue}>
            {Math.round(summaries.totals.volume)} kg
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {summaries.perContext.map((item) => (
          <View key={item.context} style={styles.contextCard}>
            <View style={styles.contextHeader}>
              <Text style={styles.contextTitle}>Treino {item.context}</Text>
              <Text style={styles.contextBadge}>
                {item.exercises} exercicio{item.exercises === 1 ? "" : "s"}
              </Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Series</Text>
                <Text style={styles.statValue}>{item.series}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Repeticoes</Text>
                <Text style={styles.statValue}>{item.reps}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Carga</Text>
                <Text style={styles.statValue}>
                  {Math.round(item.volume)} kg
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footerRow}>
        <Pressable
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={loadAll}
        >
          <Text style={styles.actionButtonText}>Atualizar</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setShowImport(true)}
        >
          <Text style={styles.actionButtonText}>Importar treinos</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleExport}
        >
          <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
            Exportar treinos
          </Text>
        </Pressable>
      </View>

      {showImport && (
        <View style={styles.importOverlay} pointerEvents="box-none">
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setShowImport(false);
              setImportText("");
            }}
          >
            <View style={styles.importScrim} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            style={styles.importCardWrapper}
          >
            <ScrollView
              contentContainerStyle={styles.importCardContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.importCard}>
                <Text style={styles.importTitle}>Importar treinos</Text>
                <Text style={styles.importHint}>
                  Cole aqui o JSON exportado (contendo o objeto "trains" com A,
                  B e C).
                </Text>
                <TextInput
                  multiline
                  numberOfLines={8}
                  value={importText}
                  onChangeText={setImportText}
                  placeholder='{ "trains": { "A": { "trains": [...] }, ... } }'
                  style={styles.importInput}
                  textAlignVertical="top"
                />

                <View style={styles.importActions}>
                  <Pressable
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => {
                      setShowImport(false);
                      setImportText("");
                    }}
                  >
                    <Text style={styles.actionButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={handleImport}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.primaryButtonText,
                      ]}
                    >
                      Importar
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}
