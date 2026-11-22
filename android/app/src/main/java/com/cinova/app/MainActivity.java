package com.cinova.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Inject Native Bridge into Capacitor WebView for In-App Updates
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.addJavascriptInterface(new CinovaNativeBridge(this, webView), "CinovaNativeBridge");
            
            // Append CINOVA identification to User Agent
            String defaultUa = webView.getSettings().getUserAgentString();
            if (defaultUa != null && !defaultUa.contains("CINOVA-Android")) {
                String appVer = "1.1.0";
                try {
                    appVer = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
                } catch (Exception ignored) {}
                webView.getSettings().setUserAgentString(defaultUa + " CINOVA-Android/" + appVer);
            }
        }

        // Hardware back button navigation: navigate WebView history
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    if (webView.canGoBack()) {
                        webView.goBack();
                        return;
                    }
                }
                // At root: let system handle back (exit / background app)
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
            }
        });
    }
}
