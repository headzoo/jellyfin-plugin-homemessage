namespace Jellyfin.Plugin.HomeMessage.Models;

/// <summary>
/// The request body for the save action.
/// </summary>
public record SaveRequest(
    string? Message,
    bool Dismissible,
    string? BgColor,
    string? TextColor,
    string? Position
);
