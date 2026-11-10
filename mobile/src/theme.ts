import { Platform, TextStyle, ViewStyle } from 'react-native';

export const C = {
  green: '#58cc02',
  greenDark: '#46a302',
  lime: '#a5ed6e',
  eelLight: '#eef8e6',
  swan: '#e5e5e5',
  polar: '#f7f7f7',
  paper: '#ffffff',
  graphite: '#3c3c3c',
  ash: '#777777',
  mute: '#afafaf',
  blue: '#1cb0f6',
  blueDark: '#1899d6',
  bluePale: '#ddf4ff',
  purple: '#a560e8',
  beet: '#ce82ff',
  red: '#ff4b4b',
  redPale: '#ffecec',
  gold: '#ffc800',
  goldDark: '#e5a400',
  amberPale: '#fff8e6',
};

export const R = { sm: 10, md: 14, lg: 16, xl: 24, pill: 999 };

export const shadow = (depth = 2): ViewStyle => ({
  shadowColor: '#000000',
  shadowOpacity: 0.07,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: depth },
  elevation: depth,
});

export const font = Platform.select({ ios: undefined, android: undefined, default: undefined });

export const T = {
  h1: { fontSize: 26, fontWeight: '800', color: C.graphite, letterSpacing: -0.6 } as TextStyle,
  h2: { fontSize: 21, fontWeight: '800', color: C.graphite, letterSpacing: -0.4 } as TextStyle,
  h3: { fontSize: 16, fontWeight: '800', color: C.graphite } as TextStyle,
  body: { fontSize: 15, color: C.ash, lineHeight: 21 } as TextStyle,
  tiny: { fontSize: 12, color: C.ash } as TextStyle,
  label: { fontSize: 11, fontWeight: '800', color: C.ash, letterSpacing: 0.9, textTransform: 'uppercase' } as TextStyle,
};

export const card: ViewStyle = {
  backgroundColor: C.paper,
  borderRadius: R.lg,
  borderWidth: 2,
  borderColor: C.swan,
  ...shadow(2),
};
