import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import type { Theme } from "../hooks/useTheme";

// Thin wrappers over the Capacitor plugins that only do something inside
// the native app. On the web build every call is a no-op, so the rest of
// the code can call these unconditionally. Plugin promises are swallowed:
// none of this is essential, and a rejected haptic shouldn't surface.
export const isNative = Capacitor.isNativePlatform();

function swallow(): void {}

// A light tick for a piece landing on its square.
export function hapticMove(): void {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(swallow);
}

// The "wrong move" buzz.
export function hapticError(): void {
  if (isNative) Haptics.notification({ type: NotificationType.Error }).catch(swallow);
}

// Line complete.
export function hapticSuccess(): void {
  if (isNative) Haptics.notification({ type: NotificationType.Success }).catch(swallow);
}

// Style.Dark is the *dark-background* style, i.e. light status bar text.
export function applyStatusBar(theme: Theme): void {
  if (isNative) StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light }).catch(swallow);
}

// The launch screen stays up (launchAutoHide: false in capacitor.config)
// until the home screen has rendered, then cross-fades into it.
export function hideSplash(): void {
  if (isNative) SplashScreen.hide({ fadeOutDuration: 220 }).catch(swallow);
}
