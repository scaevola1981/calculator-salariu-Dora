package ro.dora.contorore;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppUpdaterPlugin.class);
        registerPlugin(ShiftNotificationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
