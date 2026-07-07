import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Sign Out Error", error.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <View className="bg-background-card p-6 rounded-2xl border border-border w-full max-w-sm items-center shadow-lg">
        <View className="w-20 h-20 bg-primary/10 rounded-full justify-center items-center mb-4 border border-primary/20">
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>

        <Text className="text-2xl font-bold text-white mb-1">My Account</Text>
        <Text className="text-foreground-muted text-sm text-center mb-8">
          {user?.email || "No email available"}
        </Text>

        <Button title="Log Out" onPress={handleSignOut} loading={loading} variant="danger" icon="log-out-outline" className="w-full" />
      </View>
    </View>
  );
}
