using System.IO;
using System.Reflection;
using Jellyfin.Plugin.HomeMessage.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage.Controllers;

/// <summary>
/// The main controller for the plugin.
/// </summary>
[ApiController]
[Route("HomeMessage")]
public class HomeMessageController : ControllerBase
{
    /// <summary>
    /// Require a logged-in session (the home screen is behind auth anyway).
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet]
    [Authorize]
    public ActionResult Get()
    {
        var cfg = Plugin.Instance!.Configuration;

        return Ok(
            new
            {
                message = cfg.Message,
                dismissible = cfg.Dismissible,
                bgColor = cfg.BgColor,
                textColor = cfg.TextColor,
                position = cfg.Position,
            }
        );
    }

    /// <summary>
    /// Save the configuration.
    /// </summary>
    /// <param name="req">The request body.</param>
    /// <returns>The response.</returns>
    [HttpPost("save")]
    [Authorize(Policy = "RequiresElevation")] // admin only
    public ActionResult Save([FromBody] SaveRequest req)
    {
        if (req is null)
        {
            return BadRequest();
        }

        var cfg = Plugin.Instance!.Configuration;
        cfg.Message = req.Message ?? cfg.Message;
        cfg.Dismissible = req.Dismissible;
        cfg.BgColor = req.BgColor ?? cfg.BgColor;
        cfg.TextColor = req.TextColor ?? cfg.TextColor;
        cfg.Position = req.Position ?? cfg.Position;

        Plugin.Instance!.UpdateConfiguration(cfg);

        return NoContent();
    }

    /// <summary>
    /// Returns the messages to display on the home page.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("messages")]
    [Authorize]
    public ActionResult Messages()
    {
        Message[] messages =
        [
            new Message("Hi", "Hi there!", false, "#333", "#fff"),
            new Message("Hello", "Hello there!", true, "#333", "#fff"),
        ];

        return Ok(messages);
    }

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/home.js")]
    [AllowAnonymous]
    public IActionResult ClientJs()
    {
        using var s = Assembly
            .GetExecutingAssembly()
            .GetManifestResourceStream("Jellyfin.Plugin.HomeMessage.Web.js.build.home.js");
        if (s is null)
        {
            Plugin.Instance!.Logger.Log(
                LogLevel.Error,
                "Could not find embedded resource {Resource}",
                "Jellyfin.Plugin.HomeMessage.Web.js.home.js"
            );
            return NotFound();
        }

        using var r = new StreamReader(s);
        Response.Headers.CacheControl = "no-store"; // dev-friendly

        return Content(r.ReadToEnd(), "application/javascript");
    }
}
