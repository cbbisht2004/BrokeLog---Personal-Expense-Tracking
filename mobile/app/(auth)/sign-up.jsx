// --- IMPORTS ---
// Clerk provides authentication (login/signup) services.
// 'useSignUp' is a "hook" — a special React function that gives this component
// access to sign-up actions like creating an account and verifying email.
import { useSignUp } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { styles } from '@/assets/styles/auth.styles'
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view'
import { Link, useRouter } from 'expo-router'
import * as React from 'react'
import { Image, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native'

// --- COMPONENT ---
// In React, a "component" is a JavaScript function that returns UI.
// 'export default' means this is the main thing this file provides —
// Expo Router automatically uses it as the screen for this route.
export default function Page() {
  // --- CLERK AUTHENTICATION HOOK ---
  // 'useSignUp()' gives us three things:
  //   isLoaded  — false until Clerk has finished initializing; we wait for this
  //               before doing anything so we don't call Clerk before it's ready
  //   signUp    — an object with methods like .create() and .prepareEmailAddressVerification()
  //   setActive — a function that activates the newly created session (logs the user in)
  const { isLoaded, signUp, setActive } = useSignUp()

  // 'useRouter()' gives us a 'router' object with navigation methods like .replace()
  const router = useRouter()

  // --- STATE ---
  // 'useState' is a React hook for storing values that can change over time.
  // When a state value changes, React re-renders (redraws) the component automatically.
  // Syntax: const [value, setValue] = React.useState(initialValue)
  //   'value'    — the current value
  //   'setValue' — the function you call to update it

  // Stores what the user types in the email field
  const [emailAddress, setEmailAddress] = React.useState('')
  // Stores what the user types in the password field
  const [password, setPassword] = React.useState('')
  // Tracks whether we are on step 1 (sign-up form) or step 2 (email verification form).
  // Starts as false (show the sign-up form first).
  const [pendingVerification, setPendingVerification] = React.useState(false)
  // Stores the 6-digit verification code the user receives by email
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState("")
  // --- STEP 1: SIGN-UP HANDLER ---
  // This function runs when the user taps the "Continue" button.
  // 'async' means the function contains asynchronous operations (things that take time,
  // like network requests). We use 'await' inside to pause and wait for each one to finish.
  const onSignUpPress = async () => {
    // Safety check: if Clerk hasn't loaded yet, do nothing.
    if (!isLoaded) return

    // 'try/catch' lets us run code that might fail (e.g. bad network, wrong password)
    // and handle the error gracefully instead of crashing the app.
    try {
      // Ask Clerk to create a new account with the email and password the user entered.
      // 'await' pauses here until Clerk responds.
      await signUp.create({
        emailAddress,
        password,
      })

      // Tell Clerk to send a verification code to the user's email address.
      // 'email_code' strategy means a numeric code will be emailed.
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Switch the UI from the sign-up form to the verification code form.
      // Calling setPendingVerification(true) updates state, which causes React
      // to re-render and show the verification screen instead.
      setPendingVerification(true)
    } catch (err) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Sign up failed. Please try again.'
      setError(msg)
    }
  }

  // --- STEP 2: EMAIL VERIFICATION HANDLER ---
  // This function runs when the user taps "Verify" after entering the emailed code.
  const onVerifyPress = async () => {
    // Safety check: if Clerk hasn't loaded yet, do nothing.
    if (!isLoaded) return

    try {
      // Send the code the user typed to Clerk for verification.
      // Clerk checks it against what was emailed and returns a result object.
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // Check if verification fully succeeded.
      if (signUpAttempt.status === 'complete') {
        // Activate the new session — this is what actually "logs the user in".
        // 'createdSessionId' is the ID of the session Clerk just created.
        await setActive({
          session: signUpAttempt.createdSessionId,
          // 'navigate' is a callback Clerk calls after activating the session.
          // We use it to decide where to send the user next.
          navigate: async ({ session }) => {
            // Some Clerk configurations require the user to complete extra tasks
            // (e.g. accept terms of service). If such a task exists, handle it first.
            if (session?.currentTask) {
              return
            }

            // No pending tasks — send the user to the app's home screen.
            // 'replace' navigates to '/root' and removes this screen from the history
            // so the user can't press Back to return to the sign-up screen.
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
  }

  // --- CONDITIONAL RENDERING: VERIFICATION SCREEN ---
  // React re-renders this function every time state changes.
  // When 'pendingVerification' is true, we return a *different* UI (the code entry form)
  // instead of the default sign-up form below. This is called "conditional rendering".
  if (pendingVerification) {
    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>Verify your email</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={styles.verificationInput}
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor="#9A8478"
          onChangeText={(code) => setCode(code)}
          keyboardType="numeric"
        />

        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
          onPress={onVerifyPress}
        >
          <Text style={styles.buttonText}>Verify</Text>
        </Pressable>
      </View>
    )
  }

  // --- MAIN SIGN-UP FORM ---
  // If 'pendingVerification' is false we reach here and render the sign-up form.
  // JSX (the HTML-looking syntax) gets compiled to regular JavaScript by the build tool.
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
    >
    <View style={styles.container}>
      <Image source={require('../../assets/images/sign-up.png')} style={styles.illustration} />
      <Text style={styles.title}>
        Create Account
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError("")}>
            <Ionicons name="close" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      ) : null}

      <TextInput
        style={[styles.input, error && styles.errorInput]}
        autoCapitalize="none"          // don't auto-capitalize the first letter
        value={emailAddress}           // controlled input: value comes from state
        placeholder="Enter email"
        placeholderTextColor="#9A8478"
        onChangeText={(email) => setEmailAddress(email)}  // update state on every keystroke
        keyboardType="email-address"   // shows the @ key on the soft keyboard
      />

      <TextInput
        style={[styles.input, error && styles.errorInput]}
        value={password}
        placeholder="Enter password"
        placeholderTextColor="#9A8478"
        secureTextEntry={true}         // hides the text (shows dots) for privacy
        onChangeText={(password) => setPassword(password)}
      />

      {/* --- Submit button ---
          The style array is built dynamically:
            1. Always apply the base 'button' style
            2. If the email OR password field is empty, also apply 'buttonDisabled' (reduced opacity)
            3. If currently pressed, also apply 'buttonPressed' (reduced opacity feedback)
          'disabled' prevents the onPress from firing when fields are empty. */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          (!emailAddress || !password) && { opacity: 0.5 },
          pressed && { opacity: 0.7 },
        ]}
        onPress={onSignUpPress}
        disabled={!emailAddress || !password}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </Pressable>

      {/* --- Navigation link to sign-in screen ---
          'Link' from expo-router renders a tappable navigation link.
          href="/sign-in" maps to the file app/(auth)/sign-in.jsx */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/sign-in">
          <Text style={styles.linkText}>Sign in</Text>
        </Link>
      </View>
      </View>
    </KeyboardAwareScrollView>
  )
}

