using System.Linq;
using Jellyfin.Plugin.HomeMessage.Models;
using MediaBrowser.Controller;

namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Stores messages in a JSON file.
/// </summary>
/// <param name="paths">Instance of the <see cref="IServerApplicationPaths"/> interface.</param>
public class MessageStore(IServerApplicationPaths paths) : Store<Message>(paths, "messages.json")
{
    /// <summary>
    /// Gets all messages from the database.
    /// </summary>
    /// <returns>The messages.</returns>
    public Message[] GetAll()
    {
        return [.. Cache];
    }

    /// <summary>
    /// Gets all messages that have not been dismissed.
    /// </summary>
    /// <param name="dismissed">The dismissed state.</param>
    /// <returns>The messages.</returns>
    public Message[] GetNotDismissed(Dismissed[] dismissed)
    {
        var ids = dismissed.Select(d => d.MessageId).ToArray();

        return [.. Cache.Where(m => !ids.Contains(m.Id))];
    }

    /// <summary>
    /// Adds the given object to the cache and writes it to the database.
    /// </summary>
    /// <param name="message">The message to add.</param>
    public void Add(Message message)
    {
        Write(message);
    }

    /// <summary>
    /// Deletes a message from the database.
    /// </summary>
    /// <param name="id">The ID of the message to delete.</param>
    public void Delete(string id)
    {
        Remove(id);
    }
}
