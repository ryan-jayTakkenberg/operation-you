import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import TodayScreen from '../screens/TodayScreen';
import JourneyScreen from '../screens/JourneyScreen';
import CoachScreen from '../screens/CoachScreen';
import MeScreen from '../screens/MeScreen';

export type MainTabsParamList = {
  Today: undefined;
  Journey: undefined;
  Coach: undefined;
  Me: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

function TabIcon({ icon, focused, accentColor }: { icon: string; focused: boolean; accentColor: string }) {
  return (
    <Text style={{ fontSize: 20, color: focused ? accentColor : '#4a5363' }}>
      {icon}
    </Text>
  );
}

export default function MainTabs() {
  const colors = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#08090c',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.ac,
        tabBarInactiveTintColor: '#4a5363',
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: 'Vandaag',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⊙" focused={focused} accentColor={colors.ac} />
          ),
        }}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{
          tabBarLabel: 'Reis',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⊞" focused={focused} accentColor={colors.ac} />
          ),
        }}
      />
      <Tab.Screen
        name="Coach"
        component={CoachScreen}
        options={{
          tabBarLabel: 'Coach',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◎" focused={focused} accentColor={colors.ac} />
          ),
        }}
      />
      <Tab.Screen
        name="Me"
        component={MeScreen}
        options={{
          tabBarLabel: 'Ik',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◉" focused={focused} accentColor={colors.ac} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
