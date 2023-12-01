<p align="center">
  <img src="logo.png" width="350" title="hover text">
</p>

<h1 align="center" style="font-weight: bold;">Deno Keyboard Locker</h1>

## What?
Handy keyboard locker for Windows written in Typescript specifically for Deno runtime.
This one is strongly inspired by the same app in AutoHotkey [version](https://github.com/sophice/ahk-keyboard-locker/), but allows you to customize hotkeys, unlock phrase etc. Also AHK version bugged for me when I was logging in any locale except en-related.

## How?
Assuming you're on Windows machine, download Deno runtime and then do in folder with this project:
```bash
deno task start
```

and here you go.
By default it locks your keyboard when you press `Ctrl + Alt + L` and unlocks when you type `unlock`. To prevent hotkey latching it also has `250` ms delay.

Pay attention that it uses some pre-compiled binaries from `systray` package to provide sys tray functionality, so your antivirus might be angry.
