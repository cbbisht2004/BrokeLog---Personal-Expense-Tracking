import {useUser} from '@clerk/clerk-expo';

import { Stack, Redirect } from 'expo-router'


export default function Layout()   {
    //a layout file to check if the user is signed in, if not redirect to the sign in page, otherwise show the app
    //if not signed in, redirect to sign in page
    const { isSignedIn} = useUser(); 
if (!isSignedIn) {return <Redirect href={'/(auth)/sign-in'} />;}
return <Stack screenOptions={{ headerShown: false }} />;
}