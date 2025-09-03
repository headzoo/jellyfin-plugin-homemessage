namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Represents an object that can be stored in a database.
/// </summary>
public interface IModel
{
    /// <summary>
    /// Gets or sets the ID.
    /// </summary>
    string Id { get; set; }

    /// <summary>
    /// Gets or sets the time when the object was created.
    /// </summary>
    long CreatedTime { get; set; }
}
