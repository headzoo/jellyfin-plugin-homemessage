using Jellyfin.Plugin.HomeMessage.Store;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.HomeMessage;

/// <summary>
/// Registers services.
/// </summary>
public sealed class PluginServiceRegistrator : IPluginServiceRegistrator
{
    /// <summary>
    /// Registers services.
    /// </summary>
    /// <param name="serviceCollection">Instance of the <see cref="IServiceCollection"/> class.</param>
    /// <param name="applicationHost">Instance of the <see cref="IServerApplicationHost"/> class.</param>
    public void RegisterServices(
        IServiceCollection serviceCollection,
        IServerApplicationHost applicationHost
    )
    {
        serviceCollection.AddSingleton<MessageStore>();
        serviceCollection.AddSingleton<DismissedStore>();
    }
}
