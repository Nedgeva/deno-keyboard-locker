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
			parameters: ['pointer'],
			result: 'bool',
		},
		DispatchMessageW: {
			parameters: ['pointer'],
			result: 'bool',
		},
		UnhookWindowsHookEx: {
			parameters: ['u32'],
			result: 'void',
		},
		CallNextHookEx: {
			parameters: ['u32', 'i32', 'u32', 'pointer'],
			result: 'u32',
		},
	});
