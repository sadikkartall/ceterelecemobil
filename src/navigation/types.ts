export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  PrivacyPolicy: undefined;
  Terms: undefined;
  About: undefined;
  Support: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Blog: undefined;
  CreatePost: undefined;
  Profile: undefined;
  Settings: undefined;
}; 