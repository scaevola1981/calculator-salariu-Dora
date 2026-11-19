package ro.dora.contorore;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.plugin.WebView;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private static final String APK_FILENAME = "update.apk";
    private static final String OTA_ZIP_FILENAME = "web-bundle.zip";

    @PluginMethod
    public void applyOtaUpdate(PluginCall call) {
        String urlString = call.getString("url");
        String version = call.getString("version", "latest");
        if (urlString == null || urlString.isEmpty()) {
            call.reject("URL lipsă pentru actualizare");
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = openConnectionFollowingRedirects(urlString);
                if (connection == null || connection.getResponseCode() >= 400) {
                    int code = connection != null ? connection.getResponseCode() : -1;
                    call.reject("Eroare server la descărcare (HTTP " + code + ")");
                    return;
                }

                long totalBytes = connection.getContentLengthLong();
                File zipFile = new File(getContext().getCacheDir(), OTA_ZIP_FILENAME);
                if (zipFile.exists()) {
                    zipFile.delete();
                }

                try (InputStream input = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream output = new FileOutputStream(zipFile)) {

                    byte[] buffer = new byte[8192];
                    long downloaded = 0;
                    int count;
                    int lastProgress = -1;

                    while ((count = input.read(buffer)) != -1) {
                        output.write(buffer, 0, count);
                        downloaded += count;

                        if (totalBytes > 0) {
                            // Download accounts for 0% - 85%
                            int progress = (int) ((downloaded * 85) / totalBytes);
                            if (progress != lastProgress) {
                                lastProgress = progress;
                                emitProgress(progress);
                            }
                        }
                    }
                    output.flush();
                }

                emitProgress(90);

                // Prepare target directory in filesDir/ota-bundles/<version>
                File otaRoot = new File(getContext().getFilesDir(), "ota-bundles");
                if (!otaRoot.exists()) {
                    otaRoot.mkdirs();
                }

                String safeVersion = version.replaceAll("[^a-zA-Z0-9._-]", "_");
                File targetDir = new File(otaRoot, safeVersion);
                if (targetDir.exists()) {
                    deleteRecursive(targetDir);
                }
                targetDir.mkdirs();

                // Unzip web-bundle.zip safely
                unzipSafely(zipFile, targetDir);
                zipFile.delete();

                File indexFile = new File(targetDir, "index.html");
                if (!indexFile.exists()) {
                    deleteRecursive(targetDir);
                    call.reject("Pachetul de actualizare nu conține index.html");
                    return;
                }

                emitProgress(98);

                // Clean up older OTA bundle folders
                File[] children = otaRoot.listFiles();
                if (children != null) {
                    for (File child : children) {
                        if (!child.getName().equals(safeVersion)) {
                            deleteRecursive(child);
                        }
                    }
                }

                // Persist serverBasePath so Capacitor loads this bundle on future restarts
                SharedPreferences prefs = getContext().getSharedPreferences(
                        WebView.WEBVIEW_PREFS_NAME,
                        Activity.MODE_PRIVATE
                );
                prefs.edit().putString(WebView.CAP_SERVER_PATH, targetDir.getAbsolutePath()).apply();

                emitProgress(100);

                getActivity().runOnUiThread(() -> {
                    try {
                        getBridge().setServerBasePath(targetDir.getAbsolutePath());
                        JSObject res = new JSObject();
                        res.put("updated", true);
                        call.resolve(res);
                    } catch (Exception e) {
                        call.reject("Eroare la aplicarea actualizării: " + e.getMessage());
                    }
                });

            } catch (Exception e) {
                call.reject("Actualizarea a eșuat: " + e.getMessage());
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).start();
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String urlString = call.getString("url");
        if (urlString == null || urlString.isEmpty()) {
            call.reject("URL lipsă pentru descărcare");
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = openConnectionFollowingRedirects(urlString);
                if (connection == null || connection.getResponseCode() >= 400) {
                    int code = connection != null ? connection.getResponseCode() : -1;
                    call.reject("Eroare server la descărcare (HTTP " + code + ")");
                    return;
                }

                long totalBytes = connection.getContentLengthLong();
                File apkFile = new File(getContext().getCacheDir(), APK_FILENAME);
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                try (InputStream input = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream output = new FileOutputStream(apkFile)) {

                    byte[] buffer = new byte[8192];
                    long downloaded = 0;
                    int count;
                    int lastProgress = -1;

                    while ((count = input.read(buffer)) != -1) {
                        output.write(buffer, 0, count);
                        downloaded += count;

                        if (totalBytes > 0) {
                            int progress = (int) ((downloaded * 100) / totalBytes);
                            if (progress != lastProgress) {
                                lastProgress = progress;
                                emitProgress(progress);
                            }
                        }
                    }
                    output.flush();
                }

                emitProgress(100);
                launchInstall(apkFile, call);

            } catch (Exception e) {
                call.reject("Descărcarea a eșuat: " + e.getMessage());
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).start();
    }

    @PluginMethod
    public void installCachedApk(PluginCall call) {
        File apkFile = new File(getContext().getCacheDir(), APK_FILENAME);
        if (!apkFile.exists()) {
            call.reject("Fișierul de actualizare nu există în cache");
            return;
        }
        launchInstall(apkFile, call);
    }

    private boolean isAllowedDownloadUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.startsWith("https://github.com/scaevola1981/calculator-salariu-dora/")
                || lower.startsWith("https://objects.githubusercontent.com/")
                || lower.startsWith("https://release-assets.githubusercontent.com/");
    }

    private HttpURLConnection openConnectionFollowingRedirects(String urlString) throws Exception {
        String currentUrl = urlString;
        int redirects = 0;
        HttpURLConnection connection = null;

        while (redirects < 6) {
            if (!isAllowedDownloadUrl(currentUrl)) {
                throw new SecurityException("Domeniu neautorizat pentru actualizare: " + currentUrl);
            }
            URL url = new URL(currentUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("User-Agent", "ContorOreDora-Updater");
            connection.connect();

            int status = connection.getResponseCode();
            if (status == HttpURLConnection.HTTP_MOVED_TEMP
                    || status == HttpURLConnection.HTTP_MOVED_PERM
                    || status == HttpURLConnection.HTTP_SEE_OTHER
                    || status == 307
                    || status == 308) {
                String nextUrl = connection.getHeaderField("Location");
                connection.disconnect();
                if (nextUrl == null) {
                    throw new Exception("Redirect invalid de la server");
                }
                currentUrl = nextUrl;
                redirects++;
            } else {
                break;
            }
        }
        return connection;
    }

    private void emitProgress(int progress) {
        JSObject progressData = new JSObject();
        progressData.put("progress", progress);
        notifyListeners("downloadProgress", progressData);
    }

    private void unzipSafely(File zipFile, File targetDir) throws Exception {
        String canonicalTarget = targetDir.getCanonicalPath();
        byte[] buffer = new byte[8192];

        try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(new FileInputStream(zipFile)))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                File outFile = new File(targetDir, entry.getName());
                String canonicalOut = outFile.getCanonicalPath();
                if (!canonicalOut.startsWith(canonicalTarget + File.separator)) {
                    throw new SecurityException("Zip path traversal blocked: " + entry.getName());
                }

                if (entry.isDirectory()) {
                    outFile.mkdirs();
                } else {
                    File parent = outFile.getParentFile();
                    if (parent != null && !parent.exists()) {
                        parent.mkdirs();
                    }
                    try (FileOutputStream fos = new FileOutputStream(outFile)) {
                        int len;
                        while ((len = zis.read(buffer)) != -1) {
                            fos.write(buffer, 0, len);
                        }
                    }
                }
                zis.closeEntry();
            }
        }
    }

    private void deleteRecursive(File fileOrDir) {
        if (fileOrDir.isDirectory()) {
            File[] children = fileOrDir.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursive(child);
                }
            }
        }
        fileOrDir.delete();
    }

    private void launchInstall(File apkFile, PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                        && !getContext().getPackageManager().canRequestPackageInstalls()) {
                    Intent permIntent = new Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:" + getContext().getPackageName())
                    );
                    permIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(permIntent);

                    JSObject res = new JSObject();
                    res.put("needsPermission", true);
                    call.resolve(res);
                    return;
                }

                Uri apkUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        apkFile
                );

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);

                JSObject res = new JSObject();
                res.put("installed", true);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Nu s-a putut porni instalarea: " + e.getMessage());
            }
        });
    }
}
