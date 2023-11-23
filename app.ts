import { KEYS, MODIFIERS } from './core/constants.ts';
import { path } from './deps.ts';
import { parseConfig } from './modules/config-parser.ts';
import { createNewSystray } from './modules/sys-tray.ts';
import { wait } from './utils/time.utils.ts';

const spawnProcess = (
	fileName: string,
	additionalArgs: readonly string[] = [],
) => new Deno.Command(Deno.execPath(), {
	args: [
		'run',
		'--allow-read',
		'--allow-ffi',
		'--unstable',
		path.resolve(path.join(Deno.cwd(), `./modules/${fileName}`)),
		...additionalArgs,
	],
	stdout: 'piped',
	stderr: 'piped',
});

const spawnHotkeyWatcher = (
	modifiers: readonly (keyof typeof MODIFIERS)[],
	key: keyof typeof KEYS,
) => {
	const mods = modifiers.reduce((acc, v) => acc | MODIFIERS[v], 0);

	return spawnProcess('standalone/watch-hotkey-hook.ts', [
		mods.toString(),
		KEYS[key].toString(),
	]);
};

const spawnKeyboardWatcher = (keyword: string) =>
	spawnProcess('standalone/watch-keyboard-hook.ts', [keyword]);

const app = async () => {
	const systray = await createNewSystray();

	Deno.addSignalListener('SIGINT', () => {
		console.log('interrupted!');
		Deno.exit();
	});

	const config = await parseConfig('./config.json');

	let locked = false;

	while (true) {
		let cp: Deno.Command | undefined;

		if (!locked) {
			cp = spawnHotkeyWatcher(config.modifiers, config.key);
		} else {
			cp = spawnKeyboardWatcher(config.keyword);
		}

		console.log(locked ? 'Locked' : 'Unlocked');

		await systray.setStatus(locked);

		const { code, stdout, stderr } = await cp.output();

		if (code !== 0) {
			console.error('Non zero exit code!');
			console.log(new TextDecoder().decode(stdout));
			console.log(new TextDecoder().decode(stderr));

			Deno.exit(1);
		}

		!locked && (await wait(config.hotkeyLatchDelayMs));
		locked = !locked;
	}
};

await app();
