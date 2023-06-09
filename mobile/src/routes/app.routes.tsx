import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { House, SignOut, Tag } from "phosphor-react-native";
import CreateAd from "../screens/CreateAd";
import Details from "../screens/Details";
import Home from "../screens/Home";
import MyAds from "../screens/MyAds";

type AppRoutes = {
  details: undefined;
  createAd: undefined;
};

export type AppNavigationProps = NativeStackNavigationProp<AppRoutes>;

const { Navigator, Screen } = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SignOutButton() {
  return null;
}

function TabRoutes() {
  return (
    <Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#1A181B",
        tabBarInactiveTintColor: "#9F9BA1",
        headerTitleStyle: {
          fontFamily: "Karla_700Bold",
          fontSize: 20,
          color: "#1A181B",
        },
        headerStyle: {
          backgroundColor: "#EDECEE",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleAlign: "center",
      }}
    >
      <Screen
        name="home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <House color={color} size={size} weight="bold" />
            ) : (
              <House color={color} size={size} />
            ),
        }}
      />
      <Screen
        name="MyAds"
        component={MyAds}
        options={{
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <Tag color={color} size={size} weight="bold" />
            ) : (
              <Tag color={color} size={size} />
            ),
          headerTitle: "Meus anúncios",
          headerShown: true,
          // headerRight: () => <Plus size={24} color="#1A181B" />, -> inside useLayoutEffect
          headerRightContainerStyle: {
            right: 24,
          },
        }}
      />
      <Screen
        name="SignOut"
        component={SignOutButton}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            console.log("SignOut");
          },
        })}
        options={{
          tabBarIcon: ({ size }) => <SignOut color="#EE7979" size={size} />,
        }}
      />
    </Navigator>
  );
}

export function AppRoutes() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "#EDECEE",
        },
        headerTitleStyle: {
          fontFamily: "Karla_700Bold",
          fontSize: 20,
          color: "#1A181B",
        },
        headerShadowVisible: false, // border bottom
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="TabRoutes" component={TabRoutes} />
      <Stack.Screen name="details" component={Details} />
      <Stack.Screen name="createAd" component={CreateAd} />
    </Stack.Navigator>
  );
}
