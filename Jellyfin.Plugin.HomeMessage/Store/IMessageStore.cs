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

    /// <summary>
    /// Gets all messages that are older than the given number of days.
    /// </summary>
    /// <param name="days">The number of days.</param>
    /// <returns>The messages.</returns>
    Message[] GetOlderThanDays(int days);
}
