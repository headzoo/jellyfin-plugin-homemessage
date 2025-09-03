using Jellyfin.Plugin.HomeMessage.Models;

namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Stores dismissed state in a JSON file.
/// </summary>
public interface IDismissedStore : IStore<Dismissed>
{
    /// <summary>
    /// Gets all dismissed state from the database for a given user.
    /// </summary>
    /// <param name="userId">The ID of the user.</param>
    /// <returns>The dismissed state.</returns>
    Dismissed[] GetByUserId(string userId);
}
