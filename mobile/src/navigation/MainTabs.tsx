import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import TodayScreen from '../screens/TodayScreen';
import VoortgangScreen from '../screens/VoortgangScreen';
import JournalScreen from '../screens/JournalScreen';
import FotosScreen from '../screens/FotosScreen';
import ProfielScreen from '../screens/ProfielScreen';
import { EVOLVE as E, EV_FONTS as F } from '../constants/theme';

export type MainTabsParamList = {
  Vandaag: undefined;
  Voortgang: undefined;
  Journal: undefined;
  Fotos: undefined;
  Profiel: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

type IconName = 'home' | 'chart' | 'doc' | 'camera' | 'person';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  const sw = 1.7;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {name === 'home' && (
        <Path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {name === 'chart' && (
        <Path d="M4 19V5M4 16l5-5 4 3 7-8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {name === 'doc' && (
        <>
          <Path d="M6 3h9l4 4v14H6z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M9 9h7M9 13h7M9 17h4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
      {name === 'camera' && (
        <>
          <Rect x={3} y={6} width={18} height={14} rx={2.5} stroke={color} strokeWidth={sw} />
          <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={sw} />
          <Path d="M8 6l1.5-2h5L16 6" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        </>
      )}
      {name === 'person' && (
        <>
          <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={sw} />
          <Path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: E.bg,
          borderTopColor: E.line,
          borderTopWidth: 1,
          height: 86,
          paddingTop: 10,
          paddingBottom: 26,
        },
        tabBarActiveTintColor: E.gold,
        tabBarInactiveTintColor: E.faint,
        tabBarLabelStyle: { fontFamily: F.bodySemi, fontSize: 10, marginTop: 4 },
      }}
    >
      <Tab.Screen
        name="Vandaag"
        component={TodayScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }}
      />
      <Tab.Screen
        name="Voortgang"
        component={VoortgangScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="chart" color={color} /> }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="doc" color={color} /> }}
      />
      <Tab.Screen
        name="Fotos"
        component={FotosScreen}
        options={{ tabBarLabel: "Foto's", tabBarIcon: ({ color }) => <TabIcon name="camera" color={color} /> }}
      />
      <Tab.Screen
        name="Profiel"
        component={ProfielScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="person" color={color} /> }}
      />
    </Tab.Navigator>
  );
}
