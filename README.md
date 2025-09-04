# Jellyfin.Plugin.HomeMessage

Adds admin-configurable messages to the Jellyfin home page, with scheduling and
per-user dismiss tracking.

## Before Installing

This plugin modifies Jellyfin’s index.html to inject a small script. On some
installs the process running Jellyfin does not have write access to the web
client folder. When that happens, the patch will fail and you’ll see a warning
in the logs (and the feature won’t activate).

### How to tell if you’re affected

* Check the server logs for messages about failing to write index.html or permission denied.
* If the plugin appears installed but nothing shows up on the home screen, it’s likely the patch didn’t apply.

## Installation

Add the manifest URL to your Jellyfin server's plugin repository list:

https://headzoo.github.io/jellyfin-plugin-homemessage/manifest.json


