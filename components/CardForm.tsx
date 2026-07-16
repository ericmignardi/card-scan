import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/Button";
import { CardImageTile } from "@/components/ui/CardImageTile";
import { FormField } from "@/components/ui/FormField";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { SPORTS, Sport } from "@/constants/theme";
import { CardFields } from "@/types/card";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface CardFormProps {
  initialValues?: Partial<CardFields>;
  frontUrl: string | null;
  backUrl: string | null;
  backEmptyText?: string;
  submitting: boolean;
  submitLabel: string;
  submitIcon: IconName;
  onSubmit: (fields: CardFields) => void;
  cancelLabel: string;
  cancelIcon: IconName;
  cancelVariant?: "outline" | "danger-outline";
  onCancel: () => void;
}

// A card's fields are edited identically whether it is being created from a fresh scan or
// corrected afterwards, so both screens drive this form and differ only in what they do
// with the result. Year is held as a string while typing and normalized on submit.
export function CardForm({
  initialValues = {},
  frontUrl,
  backUrl,
  backEmptyText,
  submitting,
  submitLabel,
  submitIcon,
  onSubmit,
  cancelLabel,
  cancelIcon,
  cancelVariant = "outline",
  onCancel,
}: CardFormProps) {
  const [playerName, setPlayerName] = useState(initialValues.player_name ?? "");
  const [year, setYear] = useState(initialValues.year?.toString() ?? "");
  const [brand, setBrand] = useState(initialValues.brand ?? "");
  const [cardNumber, setCardNumber] = useState(initialValues.card_number ?? "");
  const [sport, setSport] = useState<Sport>(initialValues.sport ?? "Baseball");
  const [isRookie, setIsRookie] = useState(initialValues.is_rookie ?? false);
  const [isHallOfFamer, setIsHallOfFamer] = useState(initialValues.is_hall_of_famer ?? false);
  const [isInsert, setIsInsert] = useState(initialValues.is_insert ?? false);
  const [isAutographed, setIsAutographed] = useState(initialValues.is_autographed ?? false);
  const [isMemorabilia, setIsMemorabilia] = useState(initialValues.is_memorabilia ?? false);

  const [serialNum, setSerialNum] = useState(initialValues.parallel_attributes?.serial_num ?? "");
  const [color, setColor] = useState(initialValues.parallel_attributes?.color ?? "");
  const [variation, setVariation] = useState(initialValues.parallel_attributes?.variation ?? "");

  function handleSubmit() {
    const parsedYear = parseInt(year, 10);

    if (!playerName.trim() || !brand.trim() || !cardNumber.trim() || !year || Number.isNaN(parsedYear)) {
      Alert.alert("Error", "Please fill in all core details (Player, Year, Brand, Card #).");
      return;
    }

    onSubmit({
      sport,
      player_name: playerName.trim(),
      year: parsedYear,
      brand: brand.trim(),
      card_number: cardNumber.trim(),
      is_rookie: isRookie,
      is_hall_of_famer: isHallOfFamer,
      is_insert: isInsert,
      is_autographed: isAutographed,
      is_memorabilia: isMemorabilia,
      parallel_attributes: {
        serial_num: serialNum.trim(),
        color: color.trim(),
        variation: variation.trim(),
      },
    });
  }

  return (
    <>
      <View className="flex-row justify-between mb-6">
        <CardImageTile uri={frontUrl} side="front" />
        <CardImageTile uri={backUrl} side="back" emptyText={backEmptyText} />
      </View>

      <View className="bg-background-card p-5 rounded-2xl border border-border mb-8 space-y-4">
        <FormField label="Player Name" value={playerName} onChangeText={setPlayerName} />

        <View className="flex-row justify-between">
          <FormField
            label="Brand/Series"
            containerClassName="w-[48%]"
            value={brand}
            onChangeText={setBrand}
          />
          <FormField
            label="Card Number (#)"
            containerClassName="w-[48%]"
            value={cardNumber}
            onChangeText={setCardNumber}
          />
        </View>

        <View className="flex-row justify-between">
          <FormField
            label="Year"
            containerClassName="w-[48%]"
            keyboardType="number-pad"
            value={year}
            onChangeText={setYear}
          />
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-sm font-semibold mb-2">Sport</Text>
            <View className="flex-row flex-wrap">
              {SPORTS.map((option) => {
                const isActive = sport === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSport(option)}
                    className={`mr-1.5 mb-1.5 px-3 py-1.5 rounded-full border ${
                      isActive ? "bg-primary border-primary" : "bg-background border-border"
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-foreground-muted"}`}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View className="border-t border-border/50 my-2" />

        <View className="space-y-3">
          <ToggleRow label="Rookie Card (RC)" value={isRookie} onValueChange={setIsRookie} />
          <ToggleRow
            label="Hall of Famer"
            hint="Player is inducted — not printed on the card, so double-check recent inductions."
            value={isHallOfFamer}
            onValueChange={setIsHallOfFamer}
          />
          <ToggleRow label="Insert Card" value={isInsert} onValueChange={setIsInsert} />
          <ToggleRow label="Autographed" value={isAutographed} onValueChange={setIsAutographed} />
          <ToggleRow label="Memorabilia/Relic" value={isMemorabilia} onValueChange={setIsMemorabilia} />
        </View>

        <View className="border-t border-border/50 my-2" />

        <View className="space-y-4">
          <Text className="text-white font-bold text-sm">Parallel & Variations</Text>
          <View className="flex-row justify-between">
            <FormField
              label="Serial Num"
              small
              containerClassName="w-[31%]"
              placeholder="e.g. 99/99"
              value={serialNum}
              onChangeText={setSerialNum}
            />
            <FormField
              label="Color/Refractor"
              small
              containerClassName="w-[31%]"
              placeholder="e.g. Gold"
              value={color}
              onChangeText={setColor}
            />
            <FormField
              label="Variation"
              small
              containerClassName="w-[31%]"
              placeholder="e.g. Holo"
              value={variation}
              onChangeText={setVariation}
            />
          </View>
        </View>
      </View>

      <View className="space-y-3 pb-16">
        <Button title={submitLabel} onPress={handleSubmit} loading={submitting} icon={submitIcon} />
        <Button
          title={cancelLabel}
          onPress={onCancel}
          disabled={submitting}
          variant={cancelVariant}
          icon={cancelIcon}
          className="mt-3"
        />
      </View>
    </>
  );
}
