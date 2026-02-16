import { yupResolver } from "@hookform/resolvers/yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as yup from "yup";
import { Exercise, TrainingContext, TrainingForm } from "../../types/training";
import { styles } from "./styles";

const exerciseSchema = yup
  .object({
    name: yup.string().required("Campo obrigatorio"),
    reps: yup
      .number()
      .typeError("Campo obrigatorio")
      .nullable()
      .required("Campo obrigatorio"),
    series: yup
      .number()
      .typeError("Campo obrigatorio")
      .nullable()
      .required("Campo obrigatorio"),
    weightActual: yup
      .number()
      .typeError("Campo obrigatorio")
      .nullable()
      .required("Campo obrigatorio"),
    weightBefore: yup
      .number()
      .typeError("Campo obrigatorio")
      .nullable()
      .required("Campo obrigatorio"),
    observations: yup.string().default(""),
  })
  .required();

const schema = yup
  .object({
    trains: yup.array().of(exerciseSchema).default([]),
  })
  .required();

const emptyExercise: Exercise = {
  name: "",
  reps: null,
  series: null,
  weightActual: null,
  weightBefore: null,
  observations: "",
};

interface Props {
  context: TrainingContext;
}

export function TrainScreen({ context }: Props) {
  const [isEdit, setIsEdit] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<TrainingForm>({
    defaultValues: { trains: [] },
    resolver: yupResolver(schema),
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "trains",
  });

  const storageKey = React.useMemo(() => `trains-${context}`, [context]);

  const loadStored = React.useCallback(async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        reset(JSON.parse(stored));
      } else {
        reset({ trains: [] });
      }
      setIsEdit(false);
    } catch (error) {
      console.warn("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }, [reset, storageKey]);

  React.useEffect(() => {
    loadStored();
  }, [loadStored]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(values));
      Alert.alert("Sucesso", "Treino salvo com sucesso");
      setIsEdit(false);
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel salvar o treino");
    }
  });

  const confirmDelete = (index: number) => {
    Alert.alert("Deletar exercicio", "Deseja remover este exercicio?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => remove(index),
      },
    ]);
  };

  const addExercise = () => {
    setIsEdit(true);
    append(emptyExercise);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Treino {context}</Text>
          <View style={styles.titleActions}>
            <Pressable
              onPress={() => setIsEdit(true)}
              style={styles.smallButton}
            >
              <Text style={styles.smallButtonText}>Editar</Text>
            </Pressable>
            <Pressable
              onPress={addExercise}
              style={[styles.smallButton, styles.addButton]}
            >
              <Text style={[styles.smallButtonText, styles.addButtonText]}>
                + Adicionar
              </Text>
            </Pressable>
          </View>
        </View>

        {fields.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Sem exercicios</Text>
            <Pressable
              onPress={addExercise}
              style={[styles.actionButton, styles.primaryButton]}
            >
              <Text style={styles.actionButtonText}>Adicionar exercicio</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            contentContainerStyle={styles.scrollContent}
          >
            {fields.map((field, index) => {
              const fieldErrors = (errors.trains && errors.trains[index]) || {};
              return (
                <View key={field.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Exercicio {index + 1}</Text>
                    <Pressable
                      disabled={!isEdit}
                      style={[
                        styles.linkButton,
                        !isEdit && styles.linkButtonDisabled,
                      ]}
                      onPress={() => confirmDelete(index)}
                    >
                      <Text
                        style={[
                          styles.linkButtonText,
                          !isEdit && styles.linkButtonTextDisabled,
                        ]}
                      >
                        Remover
                      </Text>
                    </Pressable>
                  </View>

                  <Controller
                    control={control}
                    name={`trains.${index}.name` as const}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome</Text>
                        <TextInput
                          style={[
                            styles.input,
                            fieldErrors?.name && styles.inputError,
                            !isEdit && styles.inputDisabled,
                          ]}
                          placeholder="Nome do exercicio"
                          onBlur={onBlur}
                          editable={isEdit}
                          value={value ?? ""}
                          onChangeText={onChange}
                        />
                        {isEdit && fieldErrors?.name && (
                          <Text style={styles.errorText}>
                            Campo obrigatorio
                          </Text>
                        )}
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`trains.${index}.reps` as const}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Repeticoes</Text>
                        <TextInput
                          style={[
                            styles.input,
                            fieldErrors?.reps && styles.inputError,
                            !isEdit && styles.inputDisabled,
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          editable={isEdit}
                          value={value?.toString() ?? ""}
                          onChangeText={(text) =>
                            onChange(text === "" ? null : Number(text))
                          }
                        />
                        {isEdit && fieldErrors?.reps && (
                          <Text style={styles.errorText}>
                            Campo obrigatorio
                          </Text>
                        )}
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`trains.${index}.series` as const}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Series</Text>
                        <TextInput
                          style={[
                            styles.input,
                            fieldErrors?.series && styles.inputError,
                            !isEdit && styles.inputDisabled,
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          editable={isEdit}
                          value={value?.toString() ?? ""}
                          onChangeText={(text) =>
                            onChange(text === "" ? null : Number(text))
                          }
                        />
                        {isEdit && fieldErrors?.series && (
                          <Text style={styles.errorText}>
                            Campo obrigatorio
                          </Text>
                        )}
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`trains.${index}.weightActual` as const}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Peso atual (kg)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            fieldErrors?.weightActual && styles.inputError,
                            !isEdit && styles.inputDisabled,
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          editable={isEdit}
                          value={value?.toString() ?? ""}
                          onChangeText={(text) =>
                            onChange(text === "" ? null : Number(text))
                          }
                        />
                        {isEdit && fieldErrors?.weightActual && (
                          <Text style={styles.errorText}>
                            Campo obrigatorio
                          </Text>
                        )}
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`trains.${index}.weightBefore` as const}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Peso anterior (kg)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            fieldErrors?.weightBefore && styles.inputError,
                            !isEdit && styles.inputDisabled,
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          editable={isEdit}
                          value={value?.toString() ?? ""}
                          onChangeText={(text) =>
                            onChange(text === "" ? null : Number(text))
                          }
                        />
                        {isEdit && fieldErrors?.weightBefore && (
                          <Text style={styles.errorText}>
                            Campo obrigatorio
                          </Text>
                        )}
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`trains.${index}.observations` as const}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Observacoes</Text>
                        <TextInput
                          style={[
                            styles.textArea,
                            !isEdit && styles.inputDisabled,
                          ]}
                          placeholder="Observacoes"
                          multiline
                          numberOfLines={4}
                          onBlur={onBlur}
                          editable={isEdit}
                          value={value ?? ""}
                          onChangeText={onChange}
                        />
                      </View>
                    )}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.footerRow}>
          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={loadStored}
          >
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onSubmit}
          >
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
              Salvar
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
