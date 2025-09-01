namespace Jellyfin.Plugin.HomeMessage.Models.Dto;

/// <summary>
/// Represents a message input.
/// </summary>
public record MessageInput(
    string Title,
    string Text,
    bool Dismissible,
    string BgColor,
    string TextColor,
    int? TimeStart,
    int? TimeEnd
);
