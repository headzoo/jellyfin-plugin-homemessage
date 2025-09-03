using System;
using System.Linq;
using Jellyfin.Plugin.HomeMessage.Models;
using MediaBrowser.Controller;

namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Stores messages in a JSON file.
/// </summary>
/// <param name="paths">Instance of the <see cref="IServerApplicationPaths"/> interface.</param>
public class MessageStore(IServerApplicationPaths paths)
    : Store<Message>(paths, "messages.json"),
        IMessageStore
{
    /// <inheritdoc />
    public Message[] GetNotDismissed(Dismissed[] dismissed)
    {
        var ids = dismissed.Select(d => d.MessageId).ToArray();
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        return
        [
            .. Cache
                .Where(m => !ids.Contains(m.Id))
                .Where(m => m.TimeStart is null || m.TimeStart <= now)
                .Where(m => m.TimeEnd is null || m.TimeEnd > now),
        ];
    }

    /// <inheritdoc />
    public Message[] GetOlderThanDays(int days)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var cutoff = now - (days * 24 * 60 * 60);

        return [.. Cache.Where(m => m.CreatedTime < cutoff)];
    }
}
