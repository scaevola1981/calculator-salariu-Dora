package ro.dora.contorore;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private static final String APK_FILENAME = "update.apk";

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
                String currentUrl = urlString;
                int redirects = 0;

                while (redirects < 6) {
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
                            call.reject("Redirect invalid de la server");
                            return;
                        }
                        currentUrl = nextUrl;
                        redirects++;
                    } else {
                        break;
                    }
                }

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
                                JSObject progressData = new JSObject();
                                progressData.put("progress", progress);
                                notifyListeners("downloadProgress", progressData);
                            }
                        }
                    }
                    output.flush();
                }

                JSObject doneProgress = new JSObject();
                doneProgress.put("progress", 100);
                notifyListeners("downloadProgress", doneProgress);

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
