using Jellyfin.Plugin.HomeMessage.Store;

namespace Jellyfin.Plugin.HomeMessage.Models;

/// <summary>
/// Represents a single message to display on the home page.
/// </summary>
public record Message(
    // The ID of the message.
    string Id,
    // The title of the message.
    string Title,
    // The message.
    string Text,
    // Whether or not the message is dismissible.
    bool Dismissible,
    // The background color of the message.
    string BgColor,
    // The text color of the message.
    string TextColor
) : IHasId;
