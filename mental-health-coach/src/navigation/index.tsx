// navigation/RootNavigator.tsx (DÜZƏLDİLMİŞ - BÜTÖV İŞLƏK)
import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Text,
  Switch,
  Platform,
  UIManager,
  Dimensions,
  SafeAreaView,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  useDrawerStatus,
} from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import i18n from "../localization/i18n";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import {
  getUserData,
  auth,
  deleteUserAccount,
  markAllAsRead,
  db,
} from "../services/firebaseService";
import { notificationEventEmitter } from "../services/ExpoNotificationService";
import ExpoNotificationService from "../services/ExpoNotificationService";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Ekran importları
import LanguageSelectScreen from "../screens/LanguageSelectScreen";
import LoginScreen from "../screens/LoginScreen";
import OnboardingScreens from "../screens/OnboardingScreens";
import TherapyPreparationScreen from "../screens/TherapyPreparationScreen";
import AssessmentScreen from "../screens/AssessmentScreen";
import PsychologicalTestScreen from "../screens/PsychologicalTestScreen";
import AIResponseWaitingScreen from "../screens/AIResponseWaitingScreen";
import AIIntroductionScreen from "../screens/AIIntroductionScreen";
import ChatScreen from "../screens/ChatScreen";
import JournalScreen from "../screens/JournalScreen";
import NotificationHistoryScreen from "../screens/NotificationHistoryScreen";
import DynamicAITestScreen from "../screens/DynamicAITestScreen";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const COLORS = {
  lavender: "#B7A6E6",
  darkGrey: "#2D3436",
  mediumGrey: "#636E72",
  lightGrey: "#DFE6E9",
  white: "#FFFFFF",
};

const MainHeader = ({ navigation, title }: any) => (
  <SafeAreaView style={{ backgroundColor: COLORS.lavender }}>
    <View style={styles.headerContent}>
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 5 }}>
        <MaterialCommunityIcons name="menu" size={28} color={COLORS.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitleText}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  </SafeAreaView>
);

const DrawerProfileHeader = ({ profileImage, onEditPhoto }: any) => (
  <SafeAreaView style={{ backgroundColor: COLORS.lavender }}>
    <View style={[styles.headerContent, { justifyContent: "flex-start" }]}>
      <View style={styles.headerLeftArea}>
        <TouchableOpacity onPress={onEditPhoto} activeOpacity={0.7}>
          <View style={styles.miniAvatarContainer}>
            <Image
              source={{ uri: profileImage || "https://via.placeholder.com/150" }}
              style={styles.miniAvatar}
            />
            <View style={styles.miniEditBadge}>
              <MaterialCommunityIcons name="camera" size={10} color={COLORS.white} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerEmailText} numberOfLines={1}>
          {auth.currentUser?.email}
        </Text>
      </View>
    </View>
  </SafeAreaView>
);

function CustomDrawerContent(props: any) {
  const { t } = useTranslation();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isNotifOn, setIsNotifOn] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadSavedPhoto = async () => {
      const savedPhoto = await AsyncStorage.getItem("user_profile_photo");
      if (savedPhoto) setProfileImage(savedPhoto);
    };
    loadSavedPhoto();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const handleEditPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İcazə lazım", "Profil şəklini dəyişmək üçün icazə verməlisiniz.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      await AsyncStorage.setItem("user_profile_photo", selectedUri);
      setProfileImage(selectedUri);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <DrawerProfileHeader profileImage={profileImage} onEditPhoto={handleEditPhoto} />
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={styles.drawerItemsContainer}>
          <DrawerItemList {...props} />
          <View style={styles.divider} />
          <View style={styles.settingsArea}>
            <TouchableOpacity
              style={styles.subItem}
              onPress={() => props.navigation.navigate("LanguageSelectSettings")}
            >
              <MaterialCommunityIcons name="earth" size={20} color={COLORS.lavender} />
              <Text style={styles.subItemText}>{t("menu.change_language")}</Text>
              <Text style={styles.langCode}>{i18n.language.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subItem}
              onPress={() => props.navigation.navigate("TherapySettings")}
            >
              <MaterialCommunityIcons name="brain" size={20} color={COLORS.lavender} />
              <Text style={styles.subItemText}>Terapiya Üslubu</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.lightGrey} style={{ marginRight: 15 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subItem}
              onPress={async () => {
                props.navigation.navigate("Notifications");
                const user = auth.currentUser;
                if (user) await markAllAsRead(user.uid);
              }}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.lavender} />
              <Text style={styles.subItemText}>{t("menu.notifications")}</Text>
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.lightGrey} style={{ marginRight: 15 }} />
            </TouchableOpacity>

            <View style={styles.subItem}>
              <MaterialCommunityIcons name="bell-ring-outline" size={20} color={COLORS.lavender} />
              <Text style={styles.subItemText}>{t("menu.manage_notifications")}</Text>
              <Switch
                value={isNotifOn}
                onValueChange={setIsNotifOn}
                trackColor={{ false: COLORS.lightGrey, true: COLORS.lavender }}
                thumbColor={isNotifOn ? COLORS.white : "#f4f3f4"}
                style={styles.switchStyle}
              />
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.logoutBtn} onPress={() => auth.signOut()}>
            <MaterialCommunityIcons name="logout" size={22} color="#d9534f" />
            <Text style={styles.logoutText}>{t("menu.logout")}</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
      <View style={styles.drawerFooter}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(t("menu.delete_account_title"), t("menu.delete_account_desc"), [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("common.delete"),
                style: "destructive",
                onPress: async () => {
                  await deleteUserAccount();
                  auth.signOut();
                },
              },
            ]);
          }}
        >
          <Text style={styles.deleteText}>{t("menu.delete_account")}</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>v1.0.1</Text>
      </View>
    </View>
  );
}

function JournalWithBlur(props: any) {
  const isDrawerOpen = useDrawerStatus() === "open";
  return (
    <View style={{ flex: 1 }}>
      <JournalScreen {...props} />
      {isDrawerOpen && (
        <BlurView intensity={Platform.OS === "ios" ? 25 : 60} tint="dark" style={StyleSheet.absoluteFill} />
      )}
    </View>
  );
}

function DrawerNavigator({ screenProps, navigation: drawerNavigation }: any) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleOpenNotifications = () => {
      drawerNavigation.navigate("Notifications");
    };
    notificationEventEmitter.on("openNotifications", handleOpenNotifications);
    return () => {
      notificationEventEmitter.off("openNotifications", handleOpenNotifications);
    };
  }, [drawerNavigation]);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} screenProps={screenProps} />}
      screenOptions={{
        header: (props) => <MainHeader navigation={props.navigation} title={t("menu.journal")} />,
        drawerStyle: { width: width * 0.85 },
        drawerType: "front",
        overlayColor: "transparent",
      }}
    >
      <Drawer.Screen name="Journal" options={{ title: t("menu.journal") }}>
        {(props) => (
          <JournalWithBlur
            {...props}
            onStartSession={() => props.navigation.navigate("AIIntroduction")}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="Notifications"
        component={NotificationHistoryScreen}
        options={{
          drawerItemStyle: { display: "none" },
          title: t("menu.notifications"),
        }}
      />
    </Drawer.Navigator>
  );
}

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProps, setUserProps] = useState<any>({});
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) setIsAuthenticated(false);
    });
    return unsubscribe;
  }, []);

  const handleLoginSuccess = async (user: any, navigation: any) => {
    const userData = await getUserData(user.uid);
    setUserProps({ userData, user });
    if (userData?.fullName) {
      setIsAuthenticated(true);
      ExpoNotificationService.scheduleRepeatingNotifications();
    } else {
      navigation.navigate("Onboarding");
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="LanguageSelect">
            {(props) => (
              <LanguageSelectScreen onDone={() => props.navigation.navigate("Login")} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                onLoginSuccess={(user) => handleLoginSuccess(user, props.navigation)}
                onNavigateToOnboarding={() => props.navigation.navigate("Onboarding")}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreens onDone={() => props.navigation.navigate("TherapyPrep")} />
            )}
          </Stack.Screen>

          <Stack.Screen name="TherapyPrep">
            {(props) => (
              <TherapyPreparationScreen onNext={() => props.navigation.navigate("Assessment")} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Assessment">
            {(props) => (
              <AssessmentScreen
                onNavigateToPsychologicalTest={() => props.navigation.navigate("PsychologicalTest")}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="PsychologicalTest">
            {(props) => (
              <PsychologicalTestScreen
                onNavigateToAIResponseWaiting={() => props.navigation.navigate("AIResponseWaiting")}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="AIResponseWaiting">
            {(props) => (
              <AIResponseWaitingScreen
                onNavigateToAIIntroduction={() => props.navigation.navigate("AIIntroRegistration")}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="AIIntroRegistration">
            {(props) => (
              <AIIntroductionScreen
                userData={userProps.userData}
                onNavigateToChat={() => {
                  setIsAuthenticated(true);
                  ExpoNotificationService.scheduleRepeatingNotifications();
                }}
              />
            )}
          </Stack.Screen>
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="MainDrawer">
            {(props) => <DrawerNavigator {...props} screenProps={userProps} />}
          </Stack.Screen>

          <Stack.Screen
            name="DynamicAITest"
            component={DynamicAITestScreen}
            options={{
              headerShown: true,
              title: "Psixoloji Test",
              headerStyle: { backgroundColor: COLORS.lavender },
              headerTintColor: "#fff",
            }}
          />

          <Stack.Screen
            name="LanguageSelectSettings"
            options={{
              headerShown: true,
              title: t("menu.choose_language"),
              headerStyle: { backgroundColor: COLORS.lavender },
              headerTintColor: "#fff",
            }}
          >
            {(props) => <LanguageSelectScreen onDone={() => props.navigation.goBack()} />}
          </Stack.Screen>

          <Stack.Screen
            name="TherapySettings"
            options={{
              headerShown: true,
              title: "Terapiya Üslubu",
              headerStyle: { backgroundColor: COLORS.lavender },
              headerTintColor: "#fff",
            }}
          >
            {(props) => <TherapyPreparationScreen isEditMode={true} />}
          </Stack.Screen>

          <Stack.Screen name="Chat">
            {(props) => (
              <ChatScreen
                {...props}
                {...userProps}
                onBack={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="AIIntroduction">
            {(props) => (
              <AIIntroductionScreen
                {...props}
                userData={userProps.userData}
                onNavigateToChat={(msg) => {
                  setUserProps((p: any) => ({ ...p, initialMessage: msg }));
                  props.navigation.navigate("Chat");
                }}
              />
            )}
          </Stack.Screen>
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  headerTitleText: { color: COLORS.white, fontSize: 18, fontWeight: "600" },
  headerLeftArea: { flexDirection: "row", alignItems: "center" },
  headerEmailText: {
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 10,
    opacity: 0.9,
  },
  miniAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    overflow: "visible",
    position: "relative",
  },
  miniAvatar: { width: "100%", height: "100%", borderRadius: 18 },
  miniEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.lavender,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  drawerItemsContainer: { flex: 1, paddingTop: 10 },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  settingsArea: { paddingLeft: 20 },
  subItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  subItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 15,
    color: COLORS.mediumGrey,
    fontWeight: "500",
  },
  langCode: {
    fontSize: 13,
    color: COLORS.lavender,
    fontWeight: "bold",
    marginRight: 15,
  },
  switchStyle: { marginRight: 20 },
  badgeContainer: {
    backgroundColor: "#E53E3E",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    marginRight: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    color: "#d9534f",
    fontWeight: "600",
    marginLeft: 15,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    alignItems: "center",
  },
  deleteText: { color: "#d9534f", fontSize: 13, fontWeight: "600" },
  versionText: { color: COLORS.lightGrey, fontSize: 11, marginTop: 5 },
});