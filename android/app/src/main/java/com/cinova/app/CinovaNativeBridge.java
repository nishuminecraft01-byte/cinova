package com.cinova.app;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import java.io.File;

public class CinovaNativeBridge {
    private final Activity activity;
    private final WebView webView;
    private long downloadId = -1;

    public CinovaNativeBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public int getVersionCode() {
        if (activity == null) return 1;
        try {
            PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return (int) pInfo.getLongVersionCode();
            } else {
                return pInfo.versionCode;
            }
        } catch (Exception e) {
            return 1;
        }
    }

    @JavascriptInterface
    public String getVersionName() {
        if (activity == null) return "1.0.0";
        try {
            PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            return pInfo.versionName != null ? pInfo.versionName : "1.0.0";
        } catch (Exception e) {
            return "1.0.0";
        }
    }

    @JavascriptInterface
    public int getStatusBarHeightDp() {
        if (activity == null) return 0;
        try {
            int resourceId = activity.getResources().getIdentifier("status_bar_height", "dimen", "android");
            int px = resourceId > 0 ? activity.getResources().getDimensionPixelSize(resourceId) : 0;
            float density = activity.getResources().getDisplayMetrics().density;
            return density > 0 ? (int) (px / density) : 24;
        } catch (Exception e) {
            return 24;
        }
    }

    @JavascriptInterface
    public int getNavigationBarHeightDp() {
        if (activity == null) return 0;
        try {
            int resourceId = activity.getResources().getIdentifier("navigation_bar_height", "dimen", "android");
            int px = resourceId > 0 ? activity.getResources().getDimensionPixelSize(resourceId) : 0;
            float density = activity.getResources().getDisplayMetrics().density;
            return density > 0 ? (int) (px / density) : 16;
        } catch (Exception e) {
            return 16;
        }
    }

    @JavascriptInterface
    public void startUpdate(final String apkUrl, final String targetVersion) {
        if (activity == null || apkUrl == null || apkUrl.isEmpty()) {
            return;
        }

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Check Android 8.0+ Unknown App Sources Permission
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        if (!activity.getPackageManager().canRequestPackageInstalls()) {
                            Toast.makeText(
                                activity,
                                "Please grant permission to install CINOVA updates",
                                Toast.LENGTH_LONG
                            ).show();
                            Intent permissionIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                                .setData(Uri.parse("package:" + activity.getPackageName()));
                            activity.startActivity(permissionIntent);
                            return;
                        }
                    }

                    Toast.makeText(activity, "Starting CINOVA update download...", Toast.LENGTH_SHORT).show();

                    // Target directory: app-specific downloads directory (requires no runtime storage permissions)
                    File downloadsDir = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (downloadsDir == null) {
                        downloadsDir = activity.getFilesDir();
                    }
                    if (!downloadsDir.exists()) {
                        downloadsDir.mkdirs();
                    }

                    final File targetApk = new File(downloadsDir, "CINOVA-update.apk");
                    if (targetApk.exists()) {
                        targetApk.delete();
                    }

                    DownloadManager downloadManager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
                    if (downloadManager == null) {
                        Toast.makeText(activity, "DownloadManager service unavailable", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    Uri downloadUri = Uri.parse(apkUrl);
                    DownloadManager.Request request = new DownloadManager.Request(downloadUri);
                    request.setTitle("CINOVA Update v" + (targetVersion != null ? targetVersion : ""));
                    request.setDescription("Downloading official CINOVA release...");
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationUri(Uri.fromFile(targetApk));
                    request.setMimeType("application/vnd.android.package-archive");

                    downloadId = downloadManager.enqueue(request);

                    // Register completion receiver
                    BroadcastReceiver onComplete = new BroadcastReceiver() {
                        @Override
                        public void onReceive(Context context, Intent intent) {
                            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                            if (id == downloadId) {
                                try {
                                    context.unregisterReceiver(this);
                                } catch (Exception ignored) {}

                                DownloadManager.Query query = new DownloadManager.Query();
                                query.setFilterById(downloadId);
                                Cursor cursor = downloadManager.query(query);
                                if (cursor != null && cursor.moveToFirst()) {
                                    int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                                    if (statusIndex != -1 && cursor.getInt(statusIndex) == DownloadManager.STATUS_SUCCESSFUL) {
                                        launchInstaller(context, targetApk);
                                    } else {
                                        Toast.makeText(context, "Update download failed. Please retry.", Toast.LENGTH_SHORT).show();
                                    }
                                    cursor.close();
                                }
                            }
                        }
                    };

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        activity.registerReceiver(
                            onComplete,
                            new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                            Context.RECEIVER_EXPORTED
                        );
                    } else {
                        activity.registerReceiver(
                            onComplete,
                            new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
                        );
                    }

                } catch (Exception e) {
                    Toast.makeText(activity, "Update error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private void launchInstaller(Context context, File apkFile) {
        try {
            if (!apkFile.exists() || apkFile.length() < 100000) {
                Toast.makeText(context, "Downloaded update is incomplete.", Toast.LENGTH_SHORT).show();
                return;
            }

            Uri apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Toast.makeText(context, "Opening CINOVA package installer...", Toast.LENGTH_SHORT).show();
            context.startActivity(installIntent);
        } catch (Exception e) {
            Toast.makeText(context, "Unable to launch installer: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
