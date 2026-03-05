import { SignOutButton } from '../../components/sign-out-button'
import { SignedIn, SignedOut, useSession, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTransactions } from '../../hooks/useTransactions'

export default function Page() {
  const { user } = useUser();
  const {transactions, summary, loading, loadData, deleteTransaction} = useTransactions(user.id)
  
  useEffect(() => {
    loadData();
  }, [user.id, loadData]);
  //what this does is it loads the transactions and summary for the user
  //  when the component mounts, and also whenever the user id changes 
  // (which shouldn't happen in normal usage, but it's good to have it as a dependency 
  // just in case)
  console.log ("User ID: ", user.id);
  console.log("Transactions: ", transactions)
  console.log("Summary: ", summary);

  
  // If your user isn't appearing as signed in,
  // it's possible they have session tasks to complete.
  // Learn more: https://clerk.com/docs/guides/configure/session-tasks
  const { session } = useSession()
  console.log(session?.currentTask)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      {/* Show the sign-in and sign-up buttons when the user is signed out */}
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text>Sign in</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text>Sign up</Text>
        </Link>
      </SignedOut>
      {/* Show the sign-out button when the user is signed in */}
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
        <SignOutButton />
      </SignedIn>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
})