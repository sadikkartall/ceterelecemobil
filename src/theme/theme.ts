import { MD3LightTheme } from 'react-native-paper';

const accentColor = '#a259ff';
const secondaryColor = '#343942';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: accentColor,
    onPrimary: '#ffffff',
    primaryContainer: '#e4d3ff',
    onPrimaryContainer: '#2e0051',
    secondary: '#625b71',
    onSecondary: '#ffffff',
    secondaryContainer: '#e8def8',
    onSecondaryContainer: '#1d192b',
    tertiary: '#7d5260',
    onTertiary: '#ffffff',
    tertiaryContainer: '#ffd8e4',
    onTertiaryContainer: '#31111d',
    error: '#b3261e',
    onError: '#ffffff',
    errorContainer: '#f9dedc',
    onErrorContainer: '#410e0b',
    background: '#fef7ff',
    onBackground: '#1d1b20',
    surface: '#fef7ff',
    onSurface: '#1d1b20',
    surfaceVariant: '#e7e0ec',
    onSurfaceVariant: '#6b6879',
    outline: '#79747e',
    outlineVariant: '#cab6cf',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#322f35',
    inverseOnSurface: '#f5eff7',
    inversePrimary: '#d0bcff',
    surfaceDisabled: 'rgba(29, 27, 32, 0.12)',
    onSurfaceDisabled: 'rgba(29, 27, 32, 0.38)',
    backdrop: 'rgba(50, 47, 53, 0.4)',
  },
  roundness: 16,
};



export type AppTheme = typeof lightTheme; 