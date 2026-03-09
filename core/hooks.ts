export const getUser32 = () =>
	Deno.dlopen('user32.dll', {
		SetWindowsHookExA: {
			parameters: ['i32', 'function', 'u32', 'u32'],
			result: 'u32',
		},
		GetMessageW: {
			parameters: ['pointer', 'u32', 'u32', 'u32'],
			result: 'i32',
		},
		RegisterHotKey: {
			parameters: ['pointer', 'i32', 'u32', 'u32'],
			result: 'bool',
		},
		UnregisterHotKey: {
			parameters: ['pointer', 'i32'],
			result: 'bool',
		},
		PeekMessageA: {
			parameters: ['pointer', 'pointer', 'u32', 'u32', 'u32'],
			result: 'bool',
		},
		TranslateMessage: {
			parameters: ['buffer'],
			result: 'bool',
		},
		DispatchMessageW: {
			parameters: ['buffer'],
			result: 'isize',
		},
		UnhookWindowsHookEx: {
			parameters: ['u32'],
			result: 'void',
		},
		CallNextHookEx: {
			parameters: ['u32', 'i32', 'u32', 'pointer'],
			result: 'u32',
		},
		RegisterClassExW: {
			parameters: ['buffer'],
			result: 'u16',
		},
		CreateWindowExW: {
			parameters: [
				'u32',
				'buffer',
				'buffer',
				'u32',
				'i32',
				'i32',
				'i32',
				'i32',
				'pointer',
				'pointer',
				'pointer',
				'pointer',
			],
			result: 'pointer',
		},
		DefWindowProcW: {
			parameters: ['pointer', 'u32', 'usize', 'isize'],
			result: 'isize',
		},
		CreatePopupMenu: {
			parameters: [],
			result: 'pointer',
		},
		AppendMenuW: {
			parameters: ['pointer', 'u32', 'usize', 'buffer'],
			result: 'bool',
		},
		TrackPopupMenu: {
			parameters: [
				'pointer',
				'u32',
				'i32',
				'i32',
				'i32',
				'pointer',
				'pointer',
			],
			result: 'bool',
		},
		SetForegroundWindow: {
			parameters: ['pointer'],
			result: 'bool',
		},
		GetCursorPos: {
			parameters: ['buffer'],
			result: 'bool',
		},
		PeekMessageW: {
			parameters: ['buffer', 'pointer', 'u32', 'u32', 'u32'],
			result: 'bool',
		},
		DestroyMenu: {
			parameters: ['pointer'],
			result: 'bool',
		},
		DestroyWindow: {
			parameters: ['pointer'],
			result: 'bool',
		},
		PostQuitMessage: {
			parameters: ['i32'],
			result: 'void',
		},
		LoadImageW: {
			parameters: ['pointer', 'buffer', 'u32', 'i32', 'i32', 'u32'],
			result: 'pointer',
		},
		DestroyIcon: {
			parameters: ['pointer'],
			result: 'bool',
		},
		PostMessageW: {
			parameters: ['pointer', 'u32', 'usize', 'isize'],
			result: 'bool',
		},
		UnregisterClassW: {
			parameters: ['buffer', 'pointer'],
			result: 'bool',
		},
	});

export const getShell32 = () =>
	Deno.dlopen('shell32.dll', {
		Shell_NotifyIconW: {
			parameters: ['u32', 'buffer'],
			result: 'bool',
		},
	});

export const getKernel32 = () =>
	Deno.dlopen('kernel32.dll', {
		GetModuleHandleW: {
			parameters: ['pointer'],
			result: 'pointer',
		},
	});
