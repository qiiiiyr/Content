export type Lang = 'en' | 'id';
export type Text = Record<Lang, string>;

export type Meta = {
	theme: string;
	test: boolean; // true = test episode for a candidate theme, not the current one
	title: Text;
	description: Text;
	hashtags: string[];
	sources: string[];
	scenes: Text[]; // narration, one entry per scene, same order as Scenes.tsx
};

export type SceneProps = {lang: Lang};
export type Word = {t: number; w: string}; // t = seconds from scene start

export type RenderProps = {
	id: string;
	lang: Lang;
	scenes: {audio: string; words: Word[]; frames: number; hl?: string[]}[]; // hl = words to highlight in the captions
};
