using System.Linq;
using Jellyfin.Plugin.HomeMessage.Models;
using MediaBrowser.Controller;

namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Stores dismissed state in a JSON file.
/// </summary>
/// <param name="paths">Instance of the <see cref="IServerApplicationPaths"/> interface.</param>
public class DismissedStore(IServerApplicationPaths paths)
    : Store<Dismissed>(paths, "dismissed.json")
{
    /// <summary>
    /// Gets all dismissed state from the database for a given user.
    /// </summary>
    /// <param name="userId">The ID of the user.</param>
    /// <returns>The dismissed state.</returns>
    public Dismissed[] GetByUserId(string userId)
    {
        return [.. Cache.Where(d => d.UserId == userId)];
    }
}
