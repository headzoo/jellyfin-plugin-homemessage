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

Compatibility: built for Jellyfin 10.9.x (plugin target ABI 10.9.0.0). Older
server versions may refuse to load the plugin.

## Installation

If your setup restricts writes to the Jellyfin web client directory (common with
Docker), read the “index.html Patching & Permissions” section above first. The
simplest fix is pointing Jellyfin to a writable --webdir. You can still install
the plugin without that, but the injection feature won’t activate until
permissions are sorted.

1. In Jellyfin, go to Dashboard → Plugins → Repositories.
2. Click Add and enter:
    * Name: HomeMessage (or any name you like)
    * URL: https://headzoo.github.io/jellyfin-plugin-homemessage/manifest.json
3. Click Save.
4. Go to Dashboard → Plugins → Catalog, search for HomeMessage, click Install.
5. Restart Jellyfin.
6. After restart, open Dashboard → Plugins → HomeMessage to configure.
