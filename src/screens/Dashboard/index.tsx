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

type ProgressSummary = {
  context: TrainingContext;
  improved: number;
  regressed: number;
  unchanged: number;
  avgDelta: number;
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

  const summaryStats = React.useMemo(() => {
    const contextBreakdown: ContextSummary[] = contexts.map((contextId) => {
      const trains = data[contextId]?.trains ?? [];
      const aggregate = trains.reduce(
        (acc, session) => {
          const series = session.series ?? 0;
          const reps = session.reps ?? 0;
          const weight = session.weightActual ?? 0;

          acc.series += series;
          acc.reps += reps;
          acc.volume += series * reps * weight;
          return acc;
        },
        { series: 0, reps: 0, volume: 0 },
      );

      return {
        context: contextId,
        exercises: trains.length,
        series: aggregate.series,
        reps: aggregate.reps,
        volume: aggregate.volume,
      };
    });

    const overallTotals = contextBreakdown.reduce(
      (acc, summary) => {
        acc.exercises += summary.exercises;
        acc.series += summary.series;
        acc.reps += summary.reps;
        acc.volume += summary.volume;
        return acc;
      },
      { exercises: 0, series: 0, reps: 0, volume: 0 },
    );

    return { contextBreakdown, overallTotals };
  }, [data, contexts]);

  const progressStats = React.useMemo(() => {
    let totalDelta = 0;
    let totalSessions = 0;

    const contextBreakdown: ProgressSummary[] = contexts.map((contextId) => {
      const trains = data[contextId]?.trains ?? [];
      totalSessions += trains.length;

      const metrics = trains.reduce(
        (acc, session) => {
          const before = session.weightBefore ?? 0;
          const actual = session.weightActual ?? before;
          const delta = actual - before;

          acc.deltaSum += delta;
          if (delta > 0) acc.improved += 1;
          else if (delta < 0) acc.regressed += 1;
          else acc.unchanged += 1;

          return acc;
        },
        { improved: 0, regressed: 0, unchanged: 0, deltaSum: 0 },
      );

      totalDelta += metrics.deltaSum;
      const avgDelta = trains.length ? metrics.deltaSum / trains.length : 0;

      return {
        context: contextId,
        improved: metrics.improved,
        regressed: metrics.regressed,
        unchanged: metrics.unchanged,
        avgDelta,
      };
    });

    const overallCounts = contextBreakdown.reduce(
      (acc, summary) => {
        acc.improved += summary.improved;
        acc.regressed += summary.regressed;
        acc.unchanged += summary.unchanged;
        return acc;
      },
      { improved: 0, regressed: 0, unchanged: 0 },
    );

    const avgDelta = totalSessions ? totalDelta / totalSessions : 0;

    return {
      contextBreakdown,
      overallTotals: { ...overallCounts, avgDelta },
    };
  }, [data, contexts]);

  const progressByContext = React.useMemo(() => {
    return progressStats.contextBreakdown.reduce(
      (acc, summary) => {
        acc[summary.context] = summary;
        return acc;
      },
      {} as Record<TrainingContext, ProgressSummary>,
    );
  }, [progressStats.contextBreakdown]);

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
            {summaryStats.overallTotals.exercises}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Series</Text>
          <Text style={styles.summaryValue}>
            {summaryStats.overallTotals.series}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Repeticoes</Text>
          <Text style={styles.summaryValue}>
            {summaryStats.overallTotals.reps}
          </Text>
        </View>
        {/* <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Carga estimada</Text>
          <Text style={styles.summaryValue}>
            {Math.round(summaryStats.overallTotals.volume)} kg
          </Text>
        </View> */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Evolucao media</Text>
          <Text style={styles.summaryValue}>
            {progressStats.overallTotals.avgDelta >= 0 ? "+" : ""}
            {progressStats.overallTotals.avgDelta.toFixed(1)} kg
          </Text>
          <Text style={styles.summaryFootnote}>
            {progressStats.overallTotals.improved} melhoraram,
            {progressStats.overallTotals.regressed} reduziram
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {summaryStats.contextBreakdown.map((item) => {
          const contextProgress = progressByContext[item.context];
          const delta = contextProgress?.avgDelta ?? 0;

          return (
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

              <View style={styles.progressRow}>
                <View style={[styles.progressChip, styles.progressUp]}>
                  <Text style={styles.progressChipLabel}>Melhoraram</Text>
                  <Text style={styles.progressChipValue}>
                    {contextProgress?.improved ?? 0}
                  </Text>
                </View>
                <View style={[styles.progressChip, styles.progressDown]}>
                  <Text style={styles.progressChipLabel}>Regrediram</Text>
                  <Text style={styles.progressChipValue}>
                    {contextProgress?.regressed ?? 0}
                  </Text>
                </View>
                <View style={styles.progressChip}>
                  <Text style={styles.progressChipLabel}>Delta medio</Text>
                  <Text style={styles.progressChipValue}>
                    {`${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg`}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
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
