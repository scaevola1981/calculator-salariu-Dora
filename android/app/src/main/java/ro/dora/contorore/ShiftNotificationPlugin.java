package ro.dora.contorore;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShiftNotification")
public class ShiftNotificationPlugin extends Plugin {

    private static final String CHANNEL_ID = "shift_timer_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final int REQ_POST_NOTIF = 4001;

    @PluginMethod
    public void start(PluginCall call) {
        long startTime = call.getLong("startTime", System.currentTimeMillis());
        String userName = call.getString("userName", "");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        REQ_POST_NOTIF
                );
                call.resolve();
                return;
            }
        }

        ensureChannel();

        Intent openAppIntent = new Intent(getContext(), MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(getContext(), 0, openAppIntent, flags);

        String title = (userName != null && !userName.isEmpty())
                ? "Tură activă • " + userName
                : "Tură activă în derulare";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText("Cronometrul măsoară timpul. Apasă pentru a deschide.")
                .setOngoing(true)
                .setUsesChronometer(true)
                .setWhen(startTime)
                .setShowWhen(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setContentIntent(pendingIntent);

        NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, builder.build());
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(NOTIFICATION_ID);
        }
        call.resolve();
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Cronometru Tură Activă",
                        NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Afișează durata live a turei active în bara de notificări.");
                channel.setShowBadge(false);
                nm.createNotificationChannel(channel);
            }
        }
    }
}
