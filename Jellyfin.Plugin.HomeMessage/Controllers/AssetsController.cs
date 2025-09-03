using System;
using System.IO;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage.Controllers;

/// <summary>
/// Serves the assets for the plugin.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="AssetsController"/> class.
/// </remarks>
/// <param name="logger">Instance of the <see cref="ILogger{TCategoryName}"/> interface.</param>
[ApiController]
[Route("HomeMessage/assets")]
public class AssetsController(ILogger<AssetsController> logger) : ControllerBase
{
    /// <summary>
    /// Gets the logger.
    /// </summary>
    private readonly ILogger<AssetsController> _logger = logger;

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <param name="path">The path.</param>
    /// <returns>The response.</returns>
    [HttpGet("{**path}")]
    [AllowAnonymous]
    public IActionResult GetAsset(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return NotFound();
        }

        var asm = Assembly.GetExecutingAssembly();
        var rootNs = asm.GetName().Name; // e.g., "Jellyfin.Plugin.HomeMessage"

        var safePath = path.Replace('\\', '/').TrimStart('/');
        var resourceName = $"{rootNs}.Web.{safePath.Replace('/', '.')}";
        _logger.LogDebug("Serving {Resource}", resourceName);

        var stream = asm.GetManifestResourceStream(resourceName);
        if (stream is null)
        {
            return NotFound();
        }

        var ext = Path.GetExtension(path);
        var contentType = ext.ToLowerInvariant() switch
        {
            ".js" => "application/javascript",
            ".mjs" => "application/javascript",
            ".css" => "text/css",
            ".map" => "application/json",
            ".json" => "application/json",
            ".svg" => "image/svg+xml",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".woff" => "font/woff",
            ".woff2" => "font/woff2",
            _ => "application/octet-stream",
        };

        // Optional caching headers (safe to do before returning)
        Response.Headers.CacheControl = "public, max-age=86400";
        Response.Headers.ETag =
            $"W/\"{resourceName.GetHashCode(StringComparison.Ordinal):x}{stream.Length:x}\"";

        stream.Position = 0; // just in case

        return new FileStreamResult(stream, contentType)
        {
            EnableRangeProcessing = true, // lets browser do range requests
            FileDownloadName = Path.GetFileName(path), // nice-to-have
        };
    }
}
