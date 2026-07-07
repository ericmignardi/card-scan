import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";

// expo-image isn't one of NativeWind's built-in interop targets (only core RN
// components get className support automatically), so it needs registering once here.
cssInterop(ExpoImage, { className: "style" });

export { ExpoImage as Image };
