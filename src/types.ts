export type Lang = 'en' | 'id';
export type Look = 'workshop' | 'golden' | 'editorial' | 'blueprint'; // docs/styles.md
export const LOOKS: Look[] = ['workshop', 'golden', 'editorial', 'blueprint'];
export type Text = Record<Lang, string>;

export type Meta = {
	theme: string;
	test: boolean; // true = test episode for a candidate theme, not the current one
	title: Text;
	description: Text;
	hashtags: string[];
	sources: string[];
	look?: Look; // visual style, default workshop (docs/styles.md)
	youtube?: boolean; // false = Instagram only: Instagram posts all 14 a week, YouTube 7
	scenes: Text[]; // narration, one entry per scene, same order as Scenes.tsx
};

export type SceneProps = {lang: Lang};
export type Word = {t: number; w: string}; // t = seconds from scene start

export type RenderProps = {
	id: string;
	lang: Lang;
	look?: Look;
	scenes: {audio: string; words: Word[]; frames: number; hl?: string[]}[]; // hl = words to highlight in the captions
};
