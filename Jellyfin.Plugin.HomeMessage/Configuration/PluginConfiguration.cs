using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.HomeMessage.Configuration;

/// <summary>
/// Plugin configuration.
/// </summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PluginConfiguration"/> class.
    /// </summary>
    public PluginConfiguration()
    {
        Expiration = 365;

        Styles = """
/* Wraps each message. */
.home-message-body {

}

/* The message title. */
.home-message-title {

}

/* The message time. */
.home-message-time {

}

/* The message text. */
.home-message-text p {

}
""";
    }

    /// <summary>
    /// Gets or sets styles that will be injected into the home page.
    /// </summary>
    public string Styles { get; set; }

    /// <summary>
    /// Gets or sets the expiration time in days.
    /// </summary>
    public int Expiration { get; set; }
}
