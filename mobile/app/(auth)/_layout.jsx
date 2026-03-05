import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function AuthRoutesLayout() {
  // Clerk auth state for gating the auth stack.
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    // Signed-in users skip auth screens and go home.
    return <Redirect href={'/root'} />
  }
  // Redirect to home page if user is signed in, otherwise show the auth screens.
  return <Stack screenOptions={{ headerShown: false}} />
}