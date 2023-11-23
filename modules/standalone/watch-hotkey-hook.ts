import { WM_HOTKEY } from '../../core/constants.ts';
import { getUser32 } from '../../core/hooks.ts';
import { getRandomInt } from '../../utils/number.utils.ts';

const [modifiers, keys] = Deno.args;

const user32 = getUser32();

const id = getRandomInt(111111, 222222);

const result = user32.symbols.RegisterHotKey(
	null,
	id,
	Number.parseInt(modifiers),
	Number.parseInt(keys),
);

if (!result) {
	user32.close();
	Deno.exit(1);
}

const msg = Deno.UnsafePointer.of(new ArrayBuffer(42));

const intervalId = setInterval(() => {
	const v = user32.symbols.PeekMessageA(msg, null, 0, 0, 1);
	if (v && msg) {
		const ab = Deno.UnsafePointerView.getArrayBuffer(msg, 4, 8);
		const wParam = new DataView(ab).getUint32(0, true);

		if (wParam === WM_HOTKEY) {
			user32.symbols.UnregisterHotKey(null, id);
			user32.close();
			clearInterval(intervalId);
			Deno.exit();
		}
	}
}, 200);
