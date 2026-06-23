import { createLightTheme, createDarkTheme } from '@fluentui/react-components';
import type { BrandVariants } from '@fluentui/react-components';

/**
 * Indigo-violet brand ramp for the Community Bridge design system.
 * Maps DESIGN.md's colorMeta tonal ramp to FluentUI's BrandVariants schema.
 * Primary: #6936F7 (light mode) / #A78BFA (dark mode).
 */
const indigoBrand: BrandVariants = {
  10: '#1A0A6B',
  20: '#27109E',
  30: '#3217C0',
  40: '#3B17A8',
  50: '#4A1FB5',
  60: '#5C2CE8',
  70: '#6936F7',
  80: '#7A4FF8',
  90: '#8A60F9',
  100: '#9B74FA',
  110: '#A78BFA',
  120: '#B49CFB',
  130: '#C4B5FD',
  140: '#DDD5FD',
  150: '#EDE8FE',
  160: '#F5F0FF',
};

export const hubLightTheme = createLightTheme(indigoBrand);
export const hubDarkTheme = createDarkTheme(indigoBrand);
