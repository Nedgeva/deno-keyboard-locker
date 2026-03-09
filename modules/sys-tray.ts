import { path } from '../deps.ts';
import {
	EXIT_MENU_ID,
	IMAGE_ICON,
	LR_LOADFROMFILE,
	MF_STRING,
	MSG_SIZE,
	NIF_ICON,
	NIF_MESSAGE,
	NIF_TIP,
	NIM_ADD,
	NIM_DELETE,
	NIM_MODIFY,
	NOTIFYICONDATAW_SIZE,
	PM_REMOVE,
	POINT_SIZE,
	TPM_RIGHTBUTTON,
	TRAY_CALLBACK_MESSAGE,
	TRAY_ICON_ID,
	WM_COMMAND,
	WM_DESTROY,
	WM_LBUTTONUP,
	WM_NULL,
	WM_RBUTTONUP,
	WNDCLASSEXW_SIZE,
} from '../core/constants.ts';
import { getKernel32, getShell32, getUser32 } from '../core/hooks.ts';
import {
	createBuffer,
	lowWord,
	setI32,
	setPtr,
	setU32,
	toWide,
	wideToBytes,
	writeWideInPlace,
} from '../utils/buffer.utils.ts';

const POINTER_SIZE = 8;

if (Deno.build.os !== 'windows') {
	throw new Error('System tray is only supported on Windows.');
}

if (POINTER_SIZE !== 8) {
	throw new Error('This tray implementation currently supports 64-bit only.');
}

const user32 = getUser32();
const shell32 = getShell32();
const kernel32 = getKernel32();

const classNameW = toWide('KeyboardLockerTrayWindow');
const windowNameW = toWide('KeyboardLockerTrayWindow');
const menuExitW = toWide('Exit');
const classNameBuffer = wideToBytes(classNameW);
const windowNameBuffer = wideToBytes(windowNameW);
const menuExitBuffer = wideToBytes(menuExitW);
const tooltip = 'Keyboard Locker';

const createNotifyIconData = (
	hWnd: Deno.PointerValue,
	hIcon: Deno.PointerValue | null,
): Uint8Array => {
	const data = createBuffer(NOTIFYICONDATAW_SIZE);
	setU32(data, 0, NOTIFYICONDATAW_SIZE);
	setPtr(data, 8, hWnd);
	setU32(data, 16, TRAY_ICON_ID);
	setU32(data, 20, NIF_MESSAGE | NIF_TIP | NIF_ICON);
	setU32(data, 24, TRAY_CALLBACK_MESSAGE);
	setPtr(data, 32, hIcon);
	writeWideInPlace(data, 40, 128, tooltip);
	return data;
};

const loadIconHandle = (iconPath: string): Deno.PointerValue | null => {
	const iconPathW = toWide(iconPath);
	const iconPathBuffer = wideToBytes(iconPathW);
	const loaded = user32.symbols.LoadImageW(
		null,
		iconPathBuffer as BufferSource,
		IMAGE_ICON,
		0,
		0,
		LR_LOADFROMFILE,
	);
	return loaded;
};

const updateNotifyIcon = (
	hWnd: Deno.PointerValue,
	hIcon: Deno.PointerValue | null,
	command: number,
) => {
	const data = createNotifyIconData(hWnd, hIcon);
	const ok = shell32.symbols.Shell_NotifyIconW(command, data as BufferSource);
	if (!ok) {
		throw new Error(`Shell_NotifyIconW failed for command ${command}.`);
	}
};

export const createNewSystray = (options?: { onExit?: () => void }) => {
	const hInstance = kernel32.symbols.GetModuleHandleW(null);
	if (!hInstance) {
		throw new Error('GetModuleHandleW failed.');
	}

	let hWnd: Deno.PointerValue | null = null;
	let hMenu: Deno.PointerValue | null = null;
	let currentIcon: Deno.PointerValue | null = null;
	let disposed = false;
	let pumpTimer: number | null = null;

	const showContextMenu = () => {
		if (!hWnd || !hMenu) {
			return;
		}

		const point = createBuffer(POINT_SIZE);
		if (!user32.symbols.GetCursorPos(point)) {
			return;
		}

		const pointView = new DataView(point.buffer);
		const x = pointView.getInt32(0, true);
		const y = pointView.getInt32(4, true);

		user32.symbols.SetForegroundWindow(hWnd);
		user32.symbols.TrackPopupMenu(
			hMenu,
			TPM_RIGHTBUTTON,
			x,
			y,
			0,
			hWnd,
			null,
		);
		user32.symbols.PostMessageW(hWnd, WM_NULL, 0n, 0n);
	};

	const wndProc = new Deno.UnsafeCallback(
		{
			parameters: ['pointer', 'u32', 'usize', 'isize'],
			result: 'isize',
		},
		(
			windowHandle: Deno.PointerValue,
			message: number,
			wParam: bigint,
			lParam: bigint,
		): bigint => {
			if (message === TRAY_CALLBACK_MESSAGE) {
				const eventType = lowWord(lParam);
				if (eventType === WM_LBUTTONUP || eventType === WM_RBUTTONUP) {
					showContextMenu();
					return 0n;
				}
			}

			if (message === WM_COMMAND) {
				const command = lowWord(wParam);
				if (command === EXIT_MENU_ID) {
					if (options?.onExit) {
						options.onExit();
					} else {
						Deno.exit();
					}
					return 0n;
				}
			}

			if (message === WM_DESTROY) {
				user32.symbols.PostQuitMessage(0);
				return 0n;
			}

			return user32.symbols.DefWindowProcW(
				windowHandle,
				message,
				wParam,
				lParam,
			);
		},
	);

	const wndClass = createBuffer(WNDCLASSEXW_SIZE);
	setU32(wndClass, 0, WNDCLASSEXW_SIZE);
	setU32(wndClass, 4, 0);
	setPtr(wndClass, 8, wndProc.pointer);
	setI32(wndClass, 16, 0);
	setI32(wndClass, 20, 0);
	setPtr(wndClass, 24, hInstance);
	setPtr(wndClass, 32, null);
	setPtr(wndClass, 40, null);
	setPtr(wndClass, 48, null);
	setPtr(wndClass, 56, null);
	setPtr(
		wndClass,
		64,
		Deno.UnsafePointer.of(classNameBuffer as BufferSource),
	);
	setPtr(wndClass, 72, null);

	const atom = user32.symbols.RegisterClassExW(wndClass);
	if (atom === 0) {
		throw new Error('RegisterClassExW failed.');
	}

	hWnd = user32.symbols.CreateWindowExW(
		0,
		classNameBuffer as BufferSource,
		windowNameBuffer as BufferSource,
		0,
		0,
		0,
		0,
		0,
		null,
		null,
		hInstance,
		null,
	);

	if (!hWnd) {
		wndProc.close();
		throw new Error('CreateWindowExW failed.');
	}

	hMenu = user32.symbols.CreatePopupMenu();
	if (!hMenu) {
		wndProc.close();
		throw new Error('CreatePopupMenu failed.');
	}

	if (
		!user32.symbols.AppendMenuW(
			hMenu,
			MF_STRING,
			BigInt(EXIT_MENU_ID),
			menuExitBuffer as BufferSource,
		)
	) {
		wndProc.close();
		throw new Error('AppendMenuW failed.');
	}

	const setStatus = (locked: boolean) => {
		if (!hWnd || disposed) {
			return;
		}

		const iconPath = path.resolve(
			path.join(
				Deno.cwd(),
				`./resources/${locked ? 'disabled' : 'enabled'}.ico`,
			),
		);

		const nextIcon = loadIconHandle(iconPath);
		if (!nextIcon) {
			throw new Error(`Failed to load icon from ${iconPath}`);
		}

		try {
			updateNotifyIcon(
				hWnd,
				nextIcon,
				currentIcon ? NIM_MODIFY : NIM_ADD,
			);
		} catch (error) {
			user32.symbols.DestroyIcon(nextIcon);
			throw error;
		}

		if (currentIcon) {
			user32.symbols.DestroyIcon(currentIcon);
		}

		currentIcon = nextIcon;
	};

	const dispose = () => {
		if (!hWnd || disposed) {
			return;
		}

		disposed = true;
		try {
			updateNotifyIcon(hWnd, currentIcon, NIM_DELETE);
		} catch {
			// no-op
		}
		if (currentIcon) {
			user32.symbols.DestroyIcon(currentIcon);
			currentIcon = null;
		}
		if (hMenu) {
			user32.symbols.DestroyMenu(hMenu);
			hMenu = null;
		}
		if (pumpTimer !== null) {
			clearInterval(pumpTimer);
			pumpTimer = null;
		}
		user32.symbols.DestroyWindow(hWnd);
		hWnd = null;
		user32.symbols.UnregisterClassW(
			classNameBuffer as BufferSource,
			hInstance,
		);
		wndProc.close();
	};

	const msg = createBuffer(MSG_SIZE);
	pumpTimer = setInterval(() => {
		while (user32.symbols.PeekMessageW(msg, null, 0, 0, PM_REMOVE)) {
			user32.symbols.TranslateMessage(msg);
			user32.symbols.DispatchMessageW(msg);
		}
	}, 50);

	setStatus(false);

	addEventListener('unload', dispose);

	return Promise.resolve({
		setStatus,
	});
};
