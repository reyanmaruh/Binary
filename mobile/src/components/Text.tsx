import React from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';
import { F, MONO } from '../theme';

const FAMILIES: Record<string, string> = {
  '100': F.regular,
  '200': F.regular,
  '300': F.regular,
  '400': F.regular,
  normal: F.regular,
  '500': F.medium,
  '600': F.semi,
  '700': F.bold,
  '800': F.bold,
  '900': F.bold,
  bold: F.bold,
};

/**
 * Maps a numeric fontWeight onto the matching Space Grotesk face. React Native
 * cannot synthesise weights for a bundled family consistently, so every Text in
 * the app goes through here instead of relying on fontWeight alone.
 */
function faceFor(style: TextStyle | undefined, fallbackWeight: string): TextStyle {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  if (flat.fontFamily === MONO) return {};
  const family = FAMILIES[String(flat.fontWeight ?? fallbackWeight)] || F.regular;
  return { fontFamily: family, fontWeight: 'normal' };
}

export function Text({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[style, faceFor(style as TextStyle, '400')]} />;
}

export function TextInput({ style, ...rest }: TextInputProps) {
  return <RNTextInput {...rest} style={[style, faceFor(style as TextStyle, '500')]} />;
}

export default Text;
