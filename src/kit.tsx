// Shared by the episode shell, captions, brand artwork and the paper tag: palette and the episode's language.
import {createContext} from 'react';
import type {Lang} from './types';

export const colors = {bg: '#0b1020', panel: '#151c33', text: '#e5e7eb', dim: '#94a3b8', cyan: '#38bdf8', amber: '#fbbf24', pink: '#f472b6', green: '#4ade80'};

export const LangContext = createContext<Lang>('en');
