// Shared by the episode shell, captions, brand artwork and the paper tag: palette and the episode's language.
import {createContext} from 'react';
import type {Lang, Look} from './types';

export const colors = {bg: '#0b1020', panel: '#151c33', text: '#e5e7eb', dim: '#94a3b8', cyan: '#38bdf8', amber: '#fbbf24', pink: '#f472b6', green: '#4ade80'};

export const LangContext = createContext<Lang>('en');

/** The episode's visual style (docs/styles.md). Read outside the 3D canvas: React context does not cross into it. */
export const LookContext = createContext<Look>('workshop');

/** Each look's background and accent (focus glow, labels, tags). One map, so the 3D and the graphics always match. */
export const LOOK_BG: Record<Look, string> = {workshop: '#cdbfa4', golden: '#2a160c', editorial: '#05070a', blueprint: '#071a33'};
export const LOOK_ACCENT: Record<Look, string> = {workshop: '#ffb347', golden: '#5ee1ff', editorial: '#ff4d5e', blueprint: '#5ee1ff'};
