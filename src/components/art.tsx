import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MOODC, MOODT } from '@/lib/planner';

/** Carinha do humor (0 radiante ... 5 raiva). */
export function Face({ i, size = 40 }: { i: number; size?: number }) {
  const fill = MOODC[i], ink = MOODT[i];
  const mouth = [
    'M13 23 Q20 31 27 23', // radiante
    'M14 24 Q20 29 26 24', // alegria
    'M15 25 Q20 27 25 25', // plenitude
    'M14 28 Q20 23 26 28', // tristeza
    'M14 26 Q17 24 20 26 Q23 28 26 26', // ansiedade
    'M14 27 L26 27', // raiva
  ][i];
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={19} fill={fill} />
      {i === 5 ? (
        <>
          <Path d="M11 14 L17 16" stroke={ink} strokeWidth={2} strokeLinecap="round" />
          <Path d="M29 14 L23 16" stroke={ink} strokeWidth={2} strokeLinecap="round" />
        </>
      ) : null}
      <Circle cx={14.5} cy={18} r={2} fill={ink} />
      <Circle cx={25.5} cy={18} r={2} fill={ink} />
      <Path d={mouth} stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** Copo de água, cheio ou vazio. */
export function Cup({ full, color, size = 30 }: { full: boolean; color: string; size?: number }) {
  return (
    <Svg width={size * 0.8} height={size} viewBox="0 0 24 30">
      <Path d="M3 3 H21 L18.5 27 H5.5 Z" stroke={color} strokeWidth={1.6} fill={full ? color : 'none'} strokeLinejoin="round" />
      {full ? <Rect x={7} y={8} width={2} height={8} rx={1} fill="#fff" opacity={0.6} /> : null}
    </Svg>
  );
}
