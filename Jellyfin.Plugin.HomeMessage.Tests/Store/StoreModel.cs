using Jellyfin.Plugin.HomeMessage.Store;

namespace Jellyfin.Plugin.HomeMessage.Tests.Store;

/// <summary>
/// A test model.
/// </summary>
public record StoreModel(
    // The title of the message.
    string Title
) : IModel
{
    /// <inheritdoc />
    public string Id { get; set; } = string.Empty;

    /// <inheritdoc />
    public long CreatedTime { get; set; }
}
