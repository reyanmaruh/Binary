import { Platform, TextStyle, ViewStyle } from 'react-native';

/** Palette lifted verbatim from the web build's design tokens. */
export const C = {
  green: '#58cc02',
  greenDark: '#58a700',
  lime: '#a5ed6e',
  eelLight: '#d7ffb8',
  swan: '#e5e5e5',
  lineStrong: '#d1d1d1',
  polar: '#f7f7f7',
  paper: '#ffffff',
  graphite: '#3c3c3c',
  inkStrong: '#4b4b4b',
  ash: '#777777',
  mute: '#afafaf',
  blue: '#1cb0f6',
  blueDark: '#1899d6',
  bluePale: '#ddf4ff',
  beet: '#ce82ff',
  purpleDeep: '#a560e0',
  red: '#ff4b4b',
  redDark: '#ea2b2b',
  redPale: '#ffdfe0',
  heartPale: '#ffe9e9',
  heartLine: '#ffd1d1',
  orange: '#ff9600',
  orangeDeep: '#e08600',
  amberPale: '#fff4e5',
  amberLine: '#ffe0b2',
  gold: '#ffc800',
  goldDark: '#e5b000',
  gemBg: '#f5edff',
  gemLine: '#e4d4ff',
  gemInk: '#7b3fd1',
};

export const R = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

/** Space Grotesk, the web app's typeface, loaded in App.tsx. */
export const F = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
};

export const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;

export const shadow = (depth = 2): ViewStyle => ({
  shadowColor: '#3c3c3c',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: depth },
  elevation: depth,
});

/** Kit type scale: body 16/500, headings 700 with tight tracking. */
export const T = {
  h1: { fontSize: 28, fontWeight: '700', color: C.graphite, letterSpacing: -0.9, lineHeight: 34 } as TextStyle,
  h2: { fontSize: 23, fontWeight: '700', color: C.graphite, letterSpacing: -0.7, lineHeight: 29 } as TextStyle,
  h3: { fontSize: 18, fontWeight: '700', color: C.graphite, letterSpacing: -0.3, lineHeight: 23 } as TextStyle,
  body: { fontSize: 16, fontWeight: '500', color: C.ash, lineHeight: 25 } as TextStyle,
  tiny: { fontSize: 13, fontWeight: '500', color: C.ash, lineHeight: 19 } as TextStyle,
  label: { fontSize: 11, fontWeight: '700', color: C.ash, letterSpacing: 1, textTransform: 'uppercase' } as TextStyle,
};

export const card: ViewStyle = {
  backgroundColor: C.paper,
  borderRadius: R.lg,
  borderWidth: 2,
  borderColor: C.swan,
  ...shadow(2),
};
