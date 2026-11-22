package com.cinova.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure edge-to-edge display with light icons for dark status and navigation bars
        try {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            WindowInsetsControllerCompat insetsController =
                    WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (insetsController != null) {
                insetsController.setAppearanceLightStatusBars(false);
                insetsController.setAppearanceLightNavigationBars(false);
            }
        } catch (Exception ignored) {}

        // Listen for WindowInsets and inject safe-area variables dynamically into the WebView
        try {
            ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, windowInsets) -> {
                int statusBarTop = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                int navBarBottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                float density = getResources().getDisplayMetrics().density;
                int topDp = density > 0 ? (int) (statusBarTop / density) : 0;
                int bottomDp = density > 0 ? (int) (navBarBottom / density) : 0;

                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    webView.post(() -> {
                        String js = "document.documentElement.style.setProperty('--android-status-bar-height', '" + topDp + "px');" +
                                    "document.documentElement.style.setProperty('--android-nav-bar-height', '" + bottomDp + "px');";
                        webView.evaluateJavascript(js, null);
                    });
                }
                return ViewCompat.onApplyWindowInsets(view, windowInsets);
            });
        } catch (Exception ignored) {}

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
