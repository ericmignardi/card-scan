import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { supabase } from "@/utils/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (isSignUp && !username) {
      Alert.alert("Error", "Please choose a username.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up flow - passes the username in user metadata so our DB trigger can read it
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) {
          Alert.alert("Sign Up Error", error.message);
        } else {
          Alert.alert(
            "Success!",
            "Account created! Please check your email inbox to verify your account."
          );
        }
      } else {
        // Sign In flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert("Sign In Error", error.message);
        }
      }
    } catch (err: any) {
      Alert.alert("Authentication Error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <View className="bg-background-card p-6 rounded-2xl border border-border shadow-xl">
        <Text className="text-3xl font-extrabold text-white text-center mb-2">
          Card<Text className="text-primary">Scanner</Text>
        </Text>
        <Text className="text-foreground-muted text-center mb-8">
          {isSignUp ? "Create an account to build your inventory" : "Sign in to manage your collection"}
        </Text>

        {isSignUp && (
          <View className="mb-4">
            <Text className="text-foreground-muted text-sm font-semibold mb-2">Username</Text>
            <TextInput
              className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary"
              placeholder="choose_username"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        )}

        <View className="mb-4">
          <Text className="text-foreground-muted text-sm font-semibold mb-2">Email Address</Text>
          <TextInput
            className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary"
            placeholder="you@example.com"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-6">
          <Text className="text-foreground-muted text-sm font-semibold mb-2">Password</Text>
          <TextInput
            className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary"
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          className="bg-primary py-4 rounded-xl shadow-lg flex-row justify-center items-center"
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              {isSignUp ? "Create Account" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6"
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={loading}
        >
          <Text className="text-primary text-center text-sm font-semibold">
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
