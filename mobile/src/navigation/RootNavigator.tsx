import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const token = useStore((s) => s.token);
  const profile = useStore((s) => s.profile);
  const identity = useStore((s) => s.identity);

  const isAuthed = !!(token || profile);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthed ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !identity ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, title: 'Instellingen', headerStyle: { backgroundColor: '#08090c' }, headerTintColor: '#f4f7fb' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
