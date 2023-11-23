import { KEYS, MODIFIERS } from '../core/constants.ts';
import { z } from '../deps.ts';

export interface Config {
	readonly keyword: string;
	readonly modifiers: readonly (keyof typeof MODIFIERS)[];
	readonly key: keyof typeof KEYS;
	readonly hotkeyLatchDelayMs: number;
}

const isKey = (v: string): v is keyof typeof KEYS => v in KEYS;
const isModifier = (v: string): v is keyof typeof MODIFIERS => v in MODIFIERS;

export const parseConfig = async (path: string): Promise<Config> => {
	const file = await Deno.readTextFile(path);

	return z
		.object({
			keyword: z
				.string()
				.min(1)
				.regex(/^[A-Za-z0-9]+$/),
			modifiers: z.array(z.string().refine(isModifier)),
			key: z.string().refine(isKey),
			hotkeyLatchDelayMs: z.number().int().positive(),
		})
		.parseAsync(JSON.parse(file));
};
