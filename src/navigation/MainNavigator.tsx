import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabParamList } from './types';

import HomeScreen from '../pages/Home';
import BlogScreen from '../pages/Blog';
import CreatePostScreen from '../pages/CreatePost';
import ProfileScreen from '../pages/Profile';
import SettingsScreen from '../pages/Settings';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Blog':
              iconName = focused ? 'post' : 'post-outline';
              break;
            case 'CreatePost':
              iconName = 'plus-circle';
              break;
            case 'Profile':
              iconName = focused ? 'account-circle' : 'account-circle-outline';
              break;
            case 'Settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0.1,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
        }}
      />
      <Tab.Screen 
        name="Blog" 
        component={BlogScreen}
        options={{
          tabBarLabel: 'Blog',
        }}
      />
      <Tab.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{
          tabBarLabel: 'Gönderi',
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                backgroundColor: 'transparent',
              }}
            >
              <Icon 
                name="plus-circle" 
                size={32} 
                color="#000000"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ayarlar',
        }}
      />
    </Tab.Navigator>
  );
} 