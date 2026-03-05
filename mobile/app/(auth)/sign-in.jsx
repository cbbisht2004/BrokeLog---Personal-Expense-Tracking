// --- IMPORTS ---
import { useSignIn } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { styles } from '@/assets/styles/auth.styles'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Link, useRouter } from 'expo-router'
import * as React from 'react'
import { Image, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native'
// --- COMPONENT ---
// This function IS the Sign In screen. Expo Router maps the file path
// app/(auth)/sign-in.jsx to the '/sign-in' route and calls this function to get the UI.
export default function Page() {
  // --- CLERK AUTHENTICATION HOOK ---
  // 'useSignIn()' provides:
  //   signIn    — object with methods to start and complete a sign-in flow
  //   setActive — activates the session once sign-in succeeds (logs the user in)
  //   isLoaded  — false until Clerk has initialised; we guard every action with this
  const { signIn, setActive, isLoaded } = useSignIn()

  // Navigation helper — lets us send the user to a different screen in code.
  const router = useRouter()

  // --- STATE ---
  // Each piece of state is an independent value React tracks.
  // Calling the setter (e.g. setEmailAddress) causes the component to re-render
  // with the new value.

  // What the user has typed into the email field
  const [emailAddress, setEmailAddress] = React.useState('')
  // What the user has typed into the password field
  const [password, setPassword] = React.useState('')
  // The second-factor verification code sent by email (only used when MFA is required)
  const [code, setCode] = React.useState('')
  // Whether to show the email-code verification form instead of the password form.
  // This is triggered when Clerk requires a second factor (multi-factor authentication).
  const [showEmailCode, setShowEmailCode] = React.useState(false)
  const [error, setError] = React.useState('')

  // --- SIGN-IN HANDLER ---
  // 'useCallback' is a React hook that memoizes (caches) this function.
  // Without it, a brand-new function object would be created on every render,
  // which can cause unnecessary re-renders in child components that receive it as a prop.
  // The second argument is a dependency array — the cached function is only recreated
  // when one of those values changes.
  const onSignInPress = React.useCallback(async () => {
    // Safety guard — don't attempt anything until Clerk is ready.
    if (!isLoaded) return

    // 'try/catch' handles errors from network requests gracefully.
    try {
      // Ask Clerk to attempt a sign-in with the supplied credentials.
      // 'identifier' can be an email address or username.
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      // Clerk returns a 'status' string describing what happened.
      if (signInAttempt.status === 'complete') {
        // Success — activate the session (logs the user in) then navigate away.
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            // If Clerk has a pending task (e.g. accept updated terms), handle it first.
            if (session?.currentTask) {
              return
            }

            // All clear — send the user to the home screen.
            // 'replace' swaps the current screen so Back doesn't return to sign-in.
            router.replace('/')
          },
        })
      } else if (signInAttempt.status === 'needs_second_factor') {
        // The account has multi-factor authentication (MFA) enabled.
        // Clerk is telling us we must verify a second factor before we can log in.
        // This happens with "Client Trust" when signing in from a new device.
        // See https://clerk.com/docs/guides/secure/client-trust

        // Check which second-factor methods are available; we support 'email_code'.
        // '.find()' loops through the array and returns the first item that matches.
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code',
        )

        if (emailCodeFactor) {
          // Tell Clerk to send an email code to the user's address.
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          })
          // Switch the UI to the verification code form.
          setShowEmailCode(true)
        }
      } else {
        setError('Sign in could not be completed. Please try again.')
      }
    } catch (err) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Sign in failed. Please try again.'
      setError(msg)
    }
  }, [isLoaded, signIn, setActive, router, emailAddress, password])

  // --- MFA VERIFICATION HANDLER ---
  // Runs when the user submits the emailed verification code (second factor).
  // Also wrapped in useCallback for the same memoization reason described above.
  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded) return

    try {
      // Submit the code to Clerk to complete the second-factor check.
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,  // the value the user typed into the verification input
      })

      if (signInAttempt.status === 'complete') {
        // Both factors passed — activate the session and navigate home.
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              return
            }

            // Navigate to the home screen, replacing the auth screen in history.
            router.replace('/root')
          },
        })
      } else {
        setError('Verification could not be completed. Please check your code and try again.')
      }
    } catch (err) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Verification failed. Please try again.'
      setError(msg)
    }
  }, [isLoaded, signIn, setActive, router, code])

  // --- CONDITIONAL RENDERING: MFA VERIFICATION SCREEN ---
  // When 'showEmailCode' is true (set inside onSignInPress when MFA is required),
  // we return this verification form instead of the normal sign-in form.
  // React calls this function on every render, so the 'if' check runs each time,
  // letting us swap out entire screens based on state changes.
  if (showEmailCode) {
    return (
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
      >
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>Verify your email</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={styles.verificationInput}
          value={code}
          placeholder="Enter verification code"
          placeholderTextColor="#9A8478"
          onChangeText={(code) => { setCode(code); if (error) setError(''); }}
          keyboardType="numeric"
        />
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
          onPress={onVerifyPress}
        >
          <Text style={styles.buttonText}>Verify</Text>
        </Pressable>
      </View>
      </KeyboardAwareScrollView>
    )
  }

  // --- MAIN SIGN-IN FORM ---
  // Rendered when 'showEmailCode' is false (the normal case).
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={70}
    >
    <View style={styles.container}>
      <Image source={require('../../assets/images/sign-in.png')} style={styles.illustration} />
      <Text style={styles.title}>
        Welcome Back!
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Ionicons name="close" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      ) : null}

      <TextInput
        style={[styles.input, error && styles.errorInput]}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor="#9A8478"
        onChangeText={(emailAddress) => { setEmailAddress(emailAddress); if (error) setError(''); }}
        keyboardType="email-address"
      />

      <TextInput
        style={[styles.input, error && styles.errorInput]}
        value={password}
        placeholder="Enter password"
        placeholderTextColor="#9A8478"
        secureTextEntry={true}
        onChangeText={(password) => { setPassword(password); if (error) setError(''); }}
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          (!emailAddress || !password) && { opacity: 0.5 },
          pressed && { opacity: 0.7 },
        ]}
        onPress={onSignInPress}
        disabled={!emailAddress || !password}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/sign-up">
          <Text style={styles.linkText}>Sign up</Text>
        </Link>
      </View>
    </View>
    </KeyboardAwareScrollView>
  )
}
