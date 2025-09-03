using Jellyfin.Plugin.HomeMessage.Store;

namespace Jellyfin.Plugin.HomeMessage.Models;

/// <summary>
/// Represents a dismissed message.
/// </summary>
public record Dismissed(
    // The ID of the message.
    string MessageId,
    // The ID of the user.
    string UserId
) : IModel
{
    /// <inheritdoc />
    public string Id { get; set; } = string.Empty;

    /// <inheritdoc />
    public long CreatedTime { get; set; }
}
