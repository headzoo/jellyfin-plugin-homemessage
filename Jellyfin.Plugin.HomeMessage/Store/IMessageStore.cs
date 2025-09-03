using Jellyfin.Plugin.HomeMessage.Models;

namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Stores messages in a JSON file.
/// </summary>
public interface IMessageStore : IStore<Message>
{
    /// <summary>
    /// Gets all messages that have not been dismissed.
    /// </summary>
    /// <param name="dismissed">The dismissed state.</param>
    /// <returns>The messages.</returns>
    Message[] GetNotDismissed(Dismissed[] dismissed);
}
