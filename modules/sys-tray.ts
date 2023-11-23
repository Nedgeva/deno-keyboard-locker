import { Menu, SysTray } from '../deps.ts';
import { path } from '../deps.ts';

const ItemExit = {
	title: 'Exit',
	tooltip: 'Exit app',
	checked: false,
	enabled: true,
	click: () => Deno.exit(),
};

export const createNewSystray = () => {
	const defaultMenu: Menu = {
		icon: path.resolve(path.join(Deno.cwd(), './resources/enabled.ico')),
		isTemplateIcon: false,
		title: 'Keyboard Locker',
		tooltip: 'Keyboard Locker',
		items: [ItemExit],
	};

	const systray = new SysTray({
		menu: defaultMenu,
		debug: true,
		directory: 'bin',
	});

	const setStatus = (locked: boolean) =>
		systray.sendAction({
			type: 'update-menu',
			menu: {
				...defaultMenu,
				icon: path.resolve(
					path.join(
						Deno.cwd(),
						`./resources/${locked ? 'disabled' : 'enabled'}.ico`,
					),
				),
			},
		});

	systray.on('click', (action) => {
		'click' in action.item &&
			typeof action.item.click === 'function' &&
			action.item.click();
	});

	const value = {
		setStatus,
	};

	return new Promise<typeof value>((resolve) => {
		systray.on('ready', () => resolve(value));
	});
};
