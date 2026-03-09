export const createBuffer = (size: number) =>
	new Uint8Array(new ArrayBuffer(size));

export const toWide = (value: string): Uint16Array => {
	const wide = new Uint16Array(value.length + 1);
	for (let i = 0; i < value.length; i++) {
		wide[i] = value.charCodeAt(i);
	}
	wide[value.length] = 0;
	return wide;
};

export const setU32 = (buf: Uint8Array, offset: number, value: number) => {
	new DataView(buf.buffer).setUint32(offset, value, true);
};

export const setI32 = (buf: Uint8Array, offset: number, value: number) => {
	new DataView(buf.buffer).setInt32(offset, value, true);
};

export const setU64 = (buf: Uint8Array, offset: number, value: bigint) => {
	new DataView(buf.buffer).setBigUint64(offset, value, true);
};

export const setPtr = (
	buf: Uint8Array,
	offset: number,
	value: Deno.PointerValue | null,
) => {
	setU64(
		buf,
		offset,
		value ? Deno.UnsafePointer.value(value) : 0n,
	);
};

export const lowWord = (value: bigint): number => Number(value & 0xffffn);

export const wideToBytes = (wide: Uint16Array): Uint8Array => {
	const bytes = createBuffer(wide.length * 2);
	const view = new DataView(bytes.buffer);
	for (let i = 0; i < wide.length; i++) {
		view.setUint16(i * 2, wide[i], true);
	}
	return bytes;
};

export const writeWideInPlace = (
	buf: Uint8Array,
	offset: number,
	maxChars: number,
	value: string,
) => {
	const text = toWide(value);
	const view = new DataView(
		buf.buffer,
		buf.byteOffset + offset,
		maxChars * 2,
	);
	for (let i = 0; i < maxChars; i++) {
		const unit = i < text.length ? text[i] : 0;
		view.setUint16(i * 2, unit, true);
	}
};
