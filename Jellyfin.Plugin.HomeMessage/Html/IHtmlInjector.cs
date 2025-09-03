namespace Jellyfin.Plugin.HomeMessage.Html;

/// <summary>
/// Injects the CSS and JavaScript into the home page.
/// </summary>
public interface IHtmlInjector
{
    /// <summary>
    /// Removes the HTML that was injected into the home page.
    /// </summary>
    void Cleanup();

    /// <summary>
    /// Injects the HTML into the home page.
    /// </summary>
    void Inject();
}
