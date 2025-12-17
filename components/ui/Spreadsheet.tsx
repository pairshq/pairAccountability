import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PanResponder,
} from "react-native";
import { ChevronLeft, Save } from "lucide-react-native";

interface CellData {
  value: string;
  formula?: string;
  style?: any;
}

interface SpreadsheetData {
  cells: { [key: string]: CellData };
  columnWidths: number[];
  rowHeights: number[];
  frozenRows: number;
  frozenCols: number;
  hiddenRows: Set<number>;
  hiddenCols: Set<number>;
  mergedCells: any[];
}

interface SpreadsheetProps {
  initialData: SpreadsheetData;
  sheetName: string;
  onClose: () => void;
  onSave: (data: any) => void;
  isDark: boolean;
  colors: any;
}

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 32;
const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 20;
const INITIAL_ROWS = 50;
const INITIAL_COLS = 26;

const getColumnLabel = (index: number): string => {
  let label = "";
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
};

const getCellRef = (row: number, col: number): string => {
  return `${getColumnLabel(col)}${row + 1}`;
};

export function Spreadsheet({
  initialData,
  sheetName,
  onClose,
  onSave,
  isDark,
  colors,
}: SpreadsheetProps) {
  const [cells, setCells] = useState<{ [key: string]: CellData }>(
    initialData.cells || {}
  );
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [columnWidths, setColumnWidths] = useState<number[]>(
    initialData.columnWidths?.length
      ? initialData.columnWidths
      : Array(INITIAL_COLS).fill(DEFAULT_COL_WIDTH)
  );
  const [rowHeights, setRowHeights] = useState<number[]>(
    initialData.rowHeights?.length
      ? initialData.rowHeights
      : Array(INITIAL_ROWS).fill(DEFAULT_ROW_HEIGHT)
  );
  const [numRows, setNumRows] = useState(INITIAL_ROWS);
  const [numCols, setNumCols] = useState(INITIAL_COLS);
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ row: number; col: number } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle cell selection
  const handleCellPress = useCallback((row: number, col: number) => {
    const cellRef = getCellRef(row, col);
    
    if (editingCell && editingCell !== cellRef) {
      // Save current editing cell
      if (editValue !== (cells[editingCell]?.value || "")) {
        setCells((prev) => ({
          ...prev,
          [editingCell]: { ...prev[editingCell], value: editValue },
        }));
      }
    }
    
    setSelectedCell(cellRef);
    setSelectionStart({ row, col });
    setSelectionEnd({ row, col });
    setEditingCell(null);
  }, [editingCell, editValue, cells]);

  // Handle cell double tap to edit
  const handleCellDoublePress = useCallback((row: number, col: number) => {
    const cellRef = getCellRef(row, col);
    setSelectedCell(cellRef);
    setEditingCell(cellRef);
    setEditValue(cells[cellRef]?.value || "");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cells]);

  // Handle edit value change
  const handleEditChange = useCallback((text: string) => {
    setEditValue(text);
  }, []);

  // Handle edit submit
  const handleEditSubmit = useCallback(() => {
    if (editingCell) {
      setCells((prev) => ({
        ...prev,
        [editingCell]: { ...prev[editingCell], value: editValue },
      }));
      setEditingCell(null);
    }
  }, [editingCell, editValue]);

  // Handle keyboard navigation
  const handleKeyPress = useCallback((e: any) => {
    if (!selectedCell) return;
    
    const match = selectedCell.match(/([A-Z]+)(\d+)/);
    if (!match) return;
    
    const col = match[1].split("").reduce((acc, char, i, arr) => {
      return acc + (char.charCodeAt(0) - 65) * Math.pow(26, arr.length - 1 - i);
    }, 0);
    const row = parseInt(match[2]) - 1;
    
    let newRow = row;
    let newCol = col;
    
    switch (e.key) {
      case "ArrowUp":
        newRow = Math.max(0, row - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(numRows - 1, row + 1);
        break;
      case "ArrowLeft":
        newCol = Math.max(0, col - 1);
        break;
      case "ArrowRight":
        newCol = Math.min(numCols - 1, col + 1);
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          newCol = Math.max(0, col - 1);
        } else {
          newCol = Math.min(numCols - 1, col + 1);
        }
        break;
      case "Enter":
        if (!editingCell) {
          handleCellDoublePress(row, col);
          return;
        } else {
          handleEditSubmit();
          newRow = Math.min(numRows - 1, row + 1);
        }
        break;
      case "Escape":
        setEditingCell(null);
        return;
      default:
        return;
    }
    
    if (newRow !== row || newCol !== col) {
      handleCellPress(newRow, newCol);
    }
  }, [selectedCell, numRows, numCols, editingCell, handleCellPress, handleCellDoublePress, handleEditSubmit]);

  // Save handler
  const handleSave = useCallback(() => {
    onSave({
      cells,
      columnWidths,
      rowHeights,
    });
  }, [cells, columnWidths, rowHeights, onSave]);

  // Check if cell is in selection range
  const isCellInSelection = useCallback((row: number, col: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selectionStart, selectionEnd]);

  // Render column headers
  const renderColumnHeaders = () => (
    <View style={styles.headerRow}>
      <View style={[styles.cornerCell, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" }]} />
      {Array.from({ length: numCols }, (_, i) => (
        <View
          key={i}
          style={[
            styles.columnHeader,
            { width: columnWidths[i] || DEFAULT_COL_WIDTH, backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" },
          ]}
        >
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>
            {getColumnLabel(i)}
          </Text>
        </View>
      ))}
    </View>
  );

  // Render a single cell
  const renderCell = (row: number, col: number) => {
    const cellRef = getCellRef(row, col);
    const cellData = cells[cellRef];
    const isSelected = selectedCell === cellRef;
    const isEditing = editingCell === cellRef;
    const inSelection = isCellInSelection(row, col);

    return (
      <TouchableOpacity
        key={cellRef}
        style={[
          styles.cell,
          {
            width: columnWidths[col] || DEFAULT_COL_WIDTH,
            height: rowHeights[row] || DEFAULT_ROW_HEIGHT,
            backgroundColor: isSelected
              ? isDark ? "#2A2A5A" : "#E8F0FE"
              : inSelection
              ? isDark ? "#1A1A3A" : "#F0F4FF"
              : isDark ? "#0A0A0A" : "#FFFFFF",
            borderColor: isSelected ? "#4285F4" : isDark ? "#2A2A2A" : "#E5E7EB",
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleCellPress(row, col)}
        onLongPress={() => handleCellDoublePress(row, col)}
        activeOpacity={0.7}
      >
        {isEditing ? (
          <TextInput
            ref={inputRef}
            style={[styles.cellInput, { color: colors.text }]}
            value={editValue}
            onChangeText={handleEditChange}
            onSubmitEditing={handleEditSubmit}
            onBlur={handleEditSubmit}
            autoFocus
          />
        ) : (
          <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={1}>
            {cellData?.value || ""}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render a row
  const renderRow = (row: number) => (
    <View key={row} style={styles.row}>
      <View
        style={[
          styles.rowHeader,
          { height: rowHeights[row] || DEFAULT_ROW_HEIGHT, backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" },
        ]}
      >
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>{row + 1}</Text>
      </View>
      {Array.from({ length: numCols }, (_, col) => renderCell(row, col))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF" }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5", borderBottomColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.sheetName, { color: colors.text }]}>{sheetName}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={20} color="#4285F4" />
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Formula Bar */}
      <View style={[styles.formulaBar, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5", borderBottomColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
        <View style={[styles.cellRefBox, { backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF" }]}>
          <Text style={[styles.cellRefText, { color: colors.text }]}>{selectedCell || "A1"}</Text>
        </View>
        <TextInput
          style={[styles.formulaInput, { color: colors.text, backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF" }]}
          value={editingCell ? editValue : cells[selectedCell || ""]?.value || ""}
          onChangeText={(text) => {
            if (selectedCell && !editingCell) {
              setEditingCell(selectedCell);
            }
            setEditValue(text);
          }}
          onSubmitEditing={handleEditSubmit}
          placeholder="Enter value or formula"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Spreadsheet Grid */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.gridContainer}
        horizontal
        showsHorizontalScrollIndicator={true}
      >
        <View>
          {renderColumnHeaders()}
          <ScrollView showsVerticalScrollIndicator={true}>
            {Array.from({ length: numRows }, (_, row) => renderRow(row))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5", borderTopColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {Object.keys(cells).length} cells with data
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {numRows} rows × {numCols} columns
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  sheetName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveText: {
    color: "#4285F4",
    fontSize: 14,
    fontWeight: "500",
  },
  formulaBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  cellRefBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 50,
    alignItems: "center",
  },
  cellRefText: {
    fontSize: 13,
    fontWeight: "500",
  },
  formulaInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 13,
  },
  gridContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
  },
  cornerCell: {
    width: 50,
    height: 28,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  columnHeader: {
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
  },
  rowHeader: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  cell: {
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  cellText: {
    fontSize: 13,
  },
  cellInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
  },
});
