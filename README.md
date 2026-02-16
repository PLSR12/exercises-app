# Exercises App

Aplicativo Expo/React Native para registrar e acompanhar treinos, com abas dinâmicas para cada treino, dashboard de resumo, importação/exportação e armazenamento local em AsyncStorage.

## Recursos

- Abas de treino dinâmicas (crie/remova) com confirmação antes de excluir.
- Formulário validado (yup + react-hook-form) para exercícios: nome, séries, repetições, pesos e observações.
- Persistência local por treino via AsyncStorage.
- Dashboard com resumo por treino e totais (exercícios, séries, repetições, carga estimada).
- Exportação de treinos via compartilhamento (JSON) e importação colando o JSON exportado.
- Evolução por treino no dashboard: variação média de carga e contagem de exercícios que melhoraram/regrediram.
- UX com keyboard-aware e scroll otimizado nas telas de treino.

## Tecnologias

- React Native 0.81 + Expo 54
- TypeScript
- react-hook-form + yup
- @react-native-async-storage/async-storage

## Como rodar

1. Instale dependências: `npm install`
2. Inicie em modo Expo: `npm start`
3. Abra no dispositivo/emulador:
   - Android: `npm run android`
   - iOS: `npm run ios`
   - Web: `npm run web`

## Estrutura

- `App.tsx`: navegação por abas simples e gerenciamento dinâmico de treinos.
- `src/screens/Dashboard`: dashboard, importação/exportação.
- `src/screens/Trains`: formulário de treino com validação e lista de exercícios.
- `src/types/training.ts`: tipos de treino/exercício.

## Importar/Exportar

- Exportar: Dashboard → botão "Exportar treinos" (gera JSON e abre compartilhamento nativo).
- Importar: Dashboard → "Importar treinos" → colar JSON exportado → Importar. Valida treinos existentes (A, B, C ou os que você criou) e grava em AsyncStorage.

## Evolução

- Dashboard mostra evolução por treino: média de variação de carga, quantos exercícios melhoraram/regrediram e resumos por aba.

## Abas dinâmicas

- Botão "+ Novo" cria a próxima aba disponível (A, B, C, ...).
- Botão "×" remove a aba selecionada após confirmação e limpa o armazenamento daquele treino.

## Observações

- Os dados ficam somente no dispositivo (AsyncStorage). Considere exportar para backup.
