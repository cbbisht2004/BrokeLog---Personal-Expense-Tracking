import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider } from '@clerk/clerk-expo';





export default function RootLayout() {
  return ( 
    <ClerkProvider>
      <SafeScreen> 
        <Slot />
       </SafeScreen>
      </ClerkProvider>
  );
}
  
//to fix the header extending beyond the screen on android, we need to set headerShown to false and create our own header in each screen. This is because of a bug in react navigation where the header extends beyond the screen on android when using expo-router.