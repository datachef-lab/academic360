import { Dialog } from "@/components/ui/Dialog";
import { useTheme } from "@/hooks/use-theme";
import { ChevronDown } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  searchable = true,
}: SelectProps) {
  const { theme, colorScheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((item) => (item.label || "").toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabel = value ? options.find((item) => item.value === value)?.label : "";

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="flex-row items-center justify-between px-3 py-2.5 rounded-lg border min-h-[44px]"
        style={{
          borderColor: theme.border,
          backgroundColor: disabled
            ? isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)"
            : theme.background,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: selectedLabel ? theme.text : theme.text,
            opacity: selectedLabel ? 1 : 0.5,
            fontSize: 16,
          }}
        >
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={20} color={theme.text} style={{ opacity: 0.6 }} />
      </Pressable>

      <Dialog visible={open} onClose={() => setOpen(false)} bg={theme.background}>
        <View className="p-4 border-b" style={{ borderColor: theme.border }}>
          <Text style={{ color: theme.text }} className="text-lg font-semibold">
            {placeholder}
          </Text>
          {searchable ? (
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${placeholder.toLowerCase()}`}
              placeholderTextColor={theme.text}
              className="mt-3 px-3 py-2.5 rounded-lg border text-base"
              style={{
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              }}
            />
          ) : null}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          style={{ maxHeight: 320 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = value === item.value;
            return (
              <Pressable
                onPress={() => handleSelect(item.value)}
                className="px-4 py-3 flex-row items-center"
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(99,102,241,0.25)"
                      : "rgba(79,70,229,0.15)"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="py-8 items-center">
              <Text style={{ color: theme.text, opacity: 0.6 }}>No options found</Text>
            </View>
          }
        />
      </Dialog>
    </>
  );
}
