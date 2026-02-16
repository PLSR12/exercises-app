import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  titleActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  addButton: {
    backgroundColor: "#0f62fe",
  },
  addButtonText: {
    color: "#fff",
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#475569",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  linkButtonDisabled: {
    opacity: 0.5,
  },
  linkButtonText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  linkButtonTextDisabled: {
    color: "#a8a29e",
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#fff",
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputDisabled: {
    backgroundColor: "#f8fafc",
    color: "#94a3b8",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#0f62fe",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
  },
  actionButtonText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 15,
  },
  primaryButtonText: {
    color: "#fff",
  },
});
