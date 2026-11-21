import { execSync } from "child_process";
import { statSync, existsSync, rmSync } from "fs";
import { resolve } from "path";

const zipPath = resolve("C:/Users/thora/OneDrive/Documents/CINOVA-DEPLOY-READY.zip");
if (existsSync(zipPath)) {
  rmSync(zipPath, { force: true });
}

console.log("Creating CINOVA-DEPLOY-READY.zip...");
const psScript = `
$zipPath = 'C:\\Users\\thora\\OneDrive\\Documents\\CINOVA-DEPLOY-READY.zip';
$tempDir = Join-Path $env:TEMP ('cinova-pack-' + [guid]::NewGuid().ToString().Substring(0,8));
New-Item -ItemType Directory -Path $tempDir | Out-Null;

$exclude = @('node_modules','.next','.open-next','.git','.wrangler','.gradle','build','cache','pages-deploy');

Get-ChildItem -Path . -Force | ForEach-Object {
    if ($_.PSIsContainer) {
        if ($exclude -notcontains $_.Name) {
            Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force
        }
    } else {
        if ($_.Name -notmatch '\\.(log|tmp|zip)$') {
            Copy-Item -Path $_.FullName -Destination $tempDir -Force
        }
    }
};

Get-ChildItem -Path (Join-Path $tempDir 'android') -Directory -Recurse -Include '.gradle','build' -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force;

Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $zipPath -CompressionLevel Optimal;
Remove-Item -Recurse -Force $tempDir;
`;

execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, " ")}"`, { stdio: "inherit" });

const stats = statSync(zipPath);
const mb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`Successfully created: ${zipPath}`);
console.log(`Final File Size: ${mb} MB (${stats.size} bytes)`);
