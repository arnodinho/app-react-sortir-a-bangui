import React, {useEffect} from 'react';
import {StatusBar, Platform, useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';
import {useTheme, BaseSetting} from '@config';
import SplashScreen from 'react-native-splash-screen';
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {useSelector} from 'react-redux';
import {languageSelect} from '@selectors';
/* Main Stack Navigator */
import Main from 'app/navigation/main';
/* Modal Screen only affect iOS */
import Loading from '@screens/Loading';
import Filter from '@screens/Filter';
import PickerScreen from '@screens/PickerScreen';
import SearchHistory from '@screens/SearchHistory';
import PreviewImage from '@screens/PreviewImage';
import SelectDarkOption from '@screens/SelectDarkOption';
import SelectFontOption from '@screens/SelectFontOption';
import AlertScreen from '@screens/Alert';
import SignIn from '@screens/SignIn';
import SignUp from '@screens/SignUp';
import ResetPassword from '@screens/ResetPassword';
import ProductDetail from '@screens/ProductDetail';
import ContactUs from '@screens/ContactUs';
import AboutUs from '@screens/AboutUs';
const RootStack = createStackNavigator();

export default function Navigator() {
  const language = useSelector(languageSelect);

  const {theme, colors} = useTheme();
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    i18n.use(initReactI18next).init({
      resources: BaseSetting.resourcesLanguage,
      lng: BaseSetting.defaultLanguage,
      fallbackLng: BaseSetting.defaultLanguage,
    });
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(colors.primary, true);
    }
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [colors.primary, isDarkMode]);

  return (
    <NavigationContainer theme={theme}>
      <RootStack.Navigator
        initialRouteName="Loading"
        screenOptions={{
          headerShown: false,
        }}>
        <RootStack.Screen
          name="Loading"
          component={Loading}
          options={{gestureEnabled: false}}
        />
        <RootStack.Screen name="SignIn" component={SignIn} />
        <RootStack.Screen name="SignUp" component={SignUp} />
        <RootStack.Screen name="ResetPassword" component={ResetPassword} />
        <RootStack.Screen
          name="Alert"
          component={AlertScreen}
          options={{
            presentation: 'transparentModal',
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
            cardStyle: {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
            gestureEnabled: false,
          }}
        />
        <RootStack.Screen name="Main" component={Main} />
        <RootStack.Screen name="Filter" component={Filter} />
        <RootStack.Screen name="PickerScreen" component={PickerScreen} />
        <RootStack.Screen name="SearchHistory" component={SearchHistory} />
        <RootStack.Screen name="ProductDetail" component={ProductDetail} />
        <RootStack.Screen name="PreviewImage" component={PreviewImage} />
        <RootStack.Screen name="ContactUs" component={ContactUs} />
        <RootStack.Screen name="AboutUs" component={AboutUs} />
        <RootStack.Screen
          name="SelectDarkOption"
          component={SelectDarkOption}
          gestureEnabled={false}
          options={{
            presentation: 'transparentModal',
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
            cardStyle: {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
            gestureEnabled: false,
          }}
        />
        <RootStack.Screen
          name="SelectFontOption"
          component={SelectFontOption}
          gestureEnabled={false}
          options={{
            presentation: 'transparentModal',
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
            cardStyle: {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
            gestureEnabled: false,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
