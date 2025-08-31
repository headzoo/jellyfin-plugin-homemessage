using System;
using System.Collections.Generic;
using Jellyfin.Plugin.HomeMessage.Configuration;
using Jellyfin.Plugin.HomeMessage.Html;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage;

/// <summary>
/// The main plugin.
/// </summary>
public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    /// <summary>
    /// Initializes a new instance of the <see cref="Plugin"/> class.
    /// </summary>
    /// <param name="paths">Instance of the <see cref="IApplicationPaths"/> interface.</param>
    /// <param name="xml">Instance of the <see cref="IXmlSerializer"/> interface.</param>
    /// <param name="logger">Instance of the <see cref="ILogger"/> interface.</param>
    /// <param name="serviceProvider">Instance of the <see cref="IServiceProvider"/> interface.</param>
    /// <param name="serverConfigurationManager">Instance of the <see cref="IServerConfigurationManager"/> interface.</param>
    public Plugin(
        IApplicationPaths paths,
        IXmlSerializer xml,
        ILogger<Plugin> logger,
        IServiceProvider serviceProvider,
        IServerConfigurationManager serverConfigurationManager
    )
        : base(paths, xml)
    {
        Instance = this;
        Logger = logger;
        ServiceProvider = serviceProvider;
        ServerConfigurationManager = serverConfigurationManager;

        // Inject the HTML into the home page.
        var htmlInjector = new HtmlInjector(paths, logger);
        htmlInjector.Inject();
    }

    /// <summary>
    /// Gets the logger instance.
    /// </summary>
    public ILogger Logger { get; }

    /// <summary>
    /// Gets the service provider.
    /// </summary>
    public IServiceProvider ServiceProvider { get; }

    /// <summary>
    /// Gets the configuration.
    /// </summary>
    public IServerConfigurationManager ServerConfigurationManager { get; }

    /// <inheritdoc />
    public override string Name => "Home Message";

    /// <inheritdoc />
    public override string Description => "Display a message on the home page.";

    /// <inheritdoc />
    public override Guid Id => Guid.Parse("69d36d38-5615-4128-b2e0-30caf4c5ba86");

    /// <summary>
    /// Gets the current plugin instance.
    /// </summary>
    public static Plugin? Instance { get; private set; }

    /// <inheritdoc />
    public IEnumerable<PluginPageInfo> GetPages()
    {
        var prefix = GetType().Namespace;

        return
        [
            new PluginPageInfo
            {
                Name = Name,
                EmbeddedResourcePath = $"{prefix}.Configuration.configPage.html",
            },
        ];
    }
}
