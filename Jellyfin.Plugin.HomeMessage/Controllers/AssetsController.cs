using System.IO;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage.Controllers;

/// <summary>
/// The main controller for the plugin.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="HomeMessageController"/> class.
/// </remarks>
/// <param name="logger">Instance of the <see cref="ILogger{TCategoryName}"/> interface.</param>
[ApiController]
[Route("HomeMessage")]
public class AssetsController(ILogger<HomeMessageController> logger) : ControllerBase
{
    /// <summary>
    /// Gets the logger.
    /// </summary>
    private readonly ILogger<HomeMessageController> _logger = logger;

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/home.js")]
    [AllowAnonymous]
    public IActionResult GetHomeJs()
    {
        return GetResourceStream("Jellyfin.Plugin.HomeMessage.Web.js.build.home.js");
    }

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/home.js.map")]
    [AllowAnonymous]
    public IActionResult GetHomeJsMap()
    {
        return GetResourceStream(
            "Jellyfin.Plugin.HomeMessage.Web.js.build.home.js.map",
            "application/json"
        );
    }

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/config.js")]
    [AllowAnonymous]
    public IActionResult GetConfigJs()
    {
        return GetResourceStream("Jellyfin.Plugin.HomeMessage.Web.js.build.config.js");
    }

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/config.js.map")]
    [AllowAnonymous]
    public IActionResult GetConfigJsMap()
    {
        return GetResourceStream(
            "Jellyfin.Plugin.HomeMessage.Web.js.build.config.js.map",
            "application/json"
        );
    }

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/messages.js")]
    [AllowAnonymous]
    public IActionResult GetMessagesJs()
    {
        return GetResourceStream("Jellyfin.Plugin.HomeMessage.Web.js.build.messages.js");
    }

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/messages.js.map")]
    [AllowAnonymous]
    public IActionResult GetMessagesJsMap()
    {
        return GetResourceStream(
            "Jellyfin.Plugin.HomeMessage.Web.js.build.messages.js.map",
            "application/json"
        );
    }

    /// <summary>
    /// Gets the resource by the given name.
    /// </summary>
    /// <param name="resourceName">The name of the resource.</param>
    /// <param name="contentType">The content type.</param>
    /// <returns>The response.</returns>
    private IActionResult GetResourceStream(
        string resourceName,
        string contentType = "application/javascript"
    )
    {
        using var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
        if (s is null)
        {
            _logger.LogError("Could not find embedded resource {Resource}", resourceName);
            return NotFound();
        }

        using var r = new StreamReader(s);
        Response.Headers.CacheControl = "no-store"; // dev-friendly

        return Content(r.ReadToEnd(), contentType);
    }
}
