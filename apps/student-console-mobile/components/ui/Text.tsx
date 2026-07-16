import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { typography, type TypographyVariant } from "@/constants/theme";

type Weight = "regular" | "medium" | "semibold" | "bold" | "extrabold";

const weightMap: Record<Weight, TextStyle["fontWeight"]> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: Weight;
  align?: TextStyle["textAlign"];
}

/** Typography primitive — consistent sizes/weights from the theme scale. */
export function Text({ variant = "body", color, weight, align, style, ...props }: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        color ? { color } : null,
        weight ? { fontWeight: weightMap[weight] } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    />
  );
}
