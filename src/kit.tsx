// Shared by the episode shell, captions, brand artwork and the paper tag: palette and the episode's language.
import {createContext} from 'react';
import type {Lang, Look} from './types';

export const colors = {bg: '#0b1020', panel: '#151c33', text: '#e5e7eb', dim: '#94a3b8', cyan: '#38bdf8', amber: '#fbbf24', pink: '#f472b6', green: '#4ade80'};

export const LangContext = createContext<Lang>('en');

/** The episode's visual style (docs/styles.md). Read outside the 3D canvas: React context does not cross into it. */
export const LookContext = createContext<Look>('workshop');
