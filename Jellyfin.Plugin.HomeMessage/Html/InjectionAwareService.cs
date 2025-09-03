using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;

namespace Jellyfin.Plugin.HomeMessage.Html;

/// <summary>
/// Service that injects the Home Message HTML into the home page at startup and removes it at shutdown.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="InjectionAwareService"/> class.
/// </remarks>
/// <param name="htmlInjector">Instance of the <see cref="IHtmlInjector"/> class.</param>
public sealed class InjectionAwareService(IHtmlInjector htmlInjector) : IHostedService
{
    /// <summary>
    /// The HTML injector.
    /// </summary>
    private readonly IHtmlInjector _htmlInjector = htmlInjector;

    /// <summary>
    /// Injects the Home Message HTML into the home page.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The completed task.</returns>
    public Task StartAsync(CancellationToken cancellationToken)
    {
        _htmlInjector.Inject();

        return Task.CompletedTask;
    }

    /// <summary>
    /// Removes the Home Message HTML from the home page.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The completed task.</returns>
    public Task StopAsync(CancellationToken cancellationToken)
    {
        _htmlInjector.Cleanup();

        return Task.CompletedTask;
    }
}
