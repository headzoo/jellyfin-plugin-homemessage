const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const targetFramework = 'net8.0';
const outputDir = path.join(__dirname, 'dist');
const releaseDir = path.join(__dirname, 'release');
const codeDir = path.join(__dirname, 'Jellyfin.Plugin.HomeMessage');

try {
  execSync(
    `dotnet publish "${path.join(codeDir, 'Jellyfin.Plugin.HomeMessage.csproj')}" -c Release -f ${targetFramework} --output "${releaseDir}"`,
    {
      stdio: 'inherit',
    },
  );

  fs.mkdirSync(outputDir, { recursive: true });
  fs.copySync(
    path.join(releaseDir, 'Jellyfin.Plugin.HomeMessage.dll'),
    path.join(outputDir, 'Jellyfin.Plugin.HomeMessage.dll'),
  );
  fs.copySync(path.join(releaseDir, 'AngleSharp.dll'), path.join(outputDir, 'AngleSharp.dll'));
  fs.rm(releaseDir, { recursive: true, force: true });

  console.log('Build completed successfully!');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
