import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";

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
        {/* Profile Avatar Icon */}
        <View className="w-20 h-20 bg-primary/10 rounded-full justify-center items-center mb-4 border border-primary/20">
          <Ionicons name="person" size={40} color="#3b82f6" />
        </View>

        <Text className="text-2xl font-bold text-white mb-1">My Account</Text>
        <Text className="text-foreground-muted text-sm text-center mb-8">
          {user?.email || "No email available"}
        </Text>

        {/* Log Out Button */}
        <TouchableOpacity
          className="w-full bg-red-600/90 py-4 rounded-xl shadow-lg border border-red-500/30 flex-row justify-center items-center"
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text className="text-white text-center font-bold text-lg">Log Out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
