namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Represents an object with an ID.
/// </summary>
public interface IHasId
{
    /// <summary>
    /// Gets the ID.
    /// </summary>
    string Id { get; }
}
