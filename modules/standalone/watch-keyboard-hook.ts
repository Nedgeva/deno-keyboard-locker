import { WH_KEYBOARD_LL, WM_KEYUP } from "../../core/constants.ts";
import { getUser32 } from "../../core/hooks.ts";

const keyword = Deno.args[0];

const user32 = getUser32();

let hHook = 0;

let typedCharIndex = 0;

const cb = new Deno.UnsafeCallback(
  {
    parameters: ["i32", "u32", "pointer"],
    result: "u32",
  } as const,
  (nCode, wParam, lParam) => {
    if (nCode || wParam !== WM_KEYUP) return 1;

    if (lParam) {
      const buffer = Deno.UnsafePointerView.getArrayBuffer(lParam, 16, 0);
      const decoder = new TextDecoder();
      const vk = decoder.decode(buffer.slice(0, 1));

      if (
        keyword[typedCharIndex].toLocaleLowerCase() === vk.toLocaleLowerCase()
      ) {
        typedCharIndex++;
      } else {
        typedCharIndex = 0;
        return 1;
      }

      if (typedCharIndex === keyword.length) {
        user32.symbols.UnhookWindowsHookEx(hHook);

        typedCharIndex = 0;
        user32.close();
        cb.close();
        Deno.exit();
      }
    }

    return 1; /* user32.symbols.CallNextHookEx(hHook, nCode, wParam, lParam); */
  }
);

const watchKeyboardHook = () => {
  hHook = user32.symbols.SetWindowsHookExA(WH_KEYBOARD_LL, cb.pointer, 0, 0);

  while (
    user32.symbols.GetMessageW(
      Deno.UnsafePointer.of(new ArrayBuffer(0)),
      0,
      0,
      0
    ) !== 0
  ) {
    /*  */
  }
};

watchKeyboardHook();
