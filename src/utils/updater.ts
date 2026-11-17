import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export const APP_VERSION = '1.0.7';
const GITHUB_LATEST_RELEASE_API =
  'https://api.github.com/repos/scaevola1981/calculator-salariu-Dora/releases/latest';

export interface AppUpdaterPlugin {
  applyOtaUpdate(options: { url: string; version: string }): Promise<{ updated?: boolean }>;
  downloadAndInstall(options: { url: string }): Promise<{ installed?: boolean; needsPermission?: boolean }>;
  installCachedApk(): Promise<{ installed?: boolean; needsPermission?: boolean }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (data: { progress: number }) => void
  ): Promise<PluginListenerHandle>;
}

export const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  otaUrl?: string;
  releaseNotes?: string;
}

/**
 * Compare two semantic version strings (e.g. "1.1.0" > "1.0.0")
 */
function isNewerVersion(latest: string, current: string): boolean {
  const cleanLatest = latest.replace(/^v/i, '').trim();
  const cleanCurrent = current.replace(/^v/i, '').trim();

  const lParts = cleanLatest.split('.').map((n) => parseInt(n, 10) || 0);
  const cParts = cleanCurrent.split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(lParts.length, cParts.length);

  for (let i = 0; i < maxLen; i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

/**
 * Checks GitHub Releases for a newer APK version.
 * Fails silently when offline so 100% offline usage is never affected.
 */
export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(GITHUB_LATEST_RELEASE_API, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const latestTag: string = data.tag_name || '';
    if (!latestTag || !isNewerVersion(latestTag, APP_VERSION)) {
      return {
        hasUpdate: false,
        latestVersion: latestTag.replace(/^v/i, '') || APP_VERSION,
        downloadUrl: '',
      };
    }

    // Find web-bundle.zip (OTA silent update) and .apk asset in the release
    const assets: Array<{ name: string; browser_download_url: string }> = data.assets || [];
    const otaAsset = assets.find((a) => a.name.toLowerCase() === 'web-bundle.zip');
    const apkAsset = assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
    const downloadUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;

    return {
      hasUpdate: true,
      latestVersion: latestTag.replace(/^v/i, ''),
      downloadUrl,
      otaUrl: otaAsset ? otaAsset.browser_download_url : undefined,
      releaseNotes: data.body || undefined,
    };
  } catch {
    // Offline or network error -> silent fail
    return null;
  }
}

