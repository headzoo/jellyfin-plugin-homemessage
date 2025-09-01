using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Jellyfin.Plugin.HomeMessage.Models;
using Jellyfin.Plugin.HomeMessage.Store;
using MediaBrowser.Controller.Net;
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
/// <param name="auth">Instance of the <see cref="IAuthorizationContext"/> interface.</param>
/// <param name="logger">Instance of the <see cref="ILogger{TCategoryName}"/> interface.</param>
/// <param name="messageStore">Instance of the <see cref="MessageStore"/> class.</param>
/// <param name="dismissedStore">Instance of the <see cref="DismissedStore"/> class.</param>
[ApiController]
[Route("HomeMessage")]
public class HomeMessageController(
    IAuthorizationContext auth,
    ILogger<HomeMessageController> logger,
    MessageStore messageStore,
    DismissedStore dismissedStore
) : ControllerBase
{
    /// <summary>
    /// Gets the authorization context.
    /// </summary>
    private readonly IAuthorizationContext _auth = auth;

    /// <summary>
    /// Gets the logger.
    /// </summary>
    private readonly ILogger<HomeMessageController> _logger = logger;

    /// <summary>
    /// Gets the message store.
    /// </summary>
    private readonly MessageStore _messageStore = messageStore;

    /// <summary>
    /// Gets the dismissed store.
    /// </summary>
    private readonly DismissedStore _dismissedStore = dismissedStore;

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
    public async Task<ActionResult> MessagesAsync()
    {
        var authInfo = await _auth.GetAuthorizationInfo(Request).ConfigureAwait(false);
        if (!authInfo.IsAuthenticated || authInfo.UserId == Guid.Empty || authInfo.IsApiKey)
        {
            return Unauthorized();
        }

        var dismissed = _dismissedStore.GetByUserId(authInfo.UserId.ToString());
        var messages = _messageStore.GetNotDismissed(dismissed);

        return Ok(messages);
    }

    /// <summary>
    /// Deletes a message.
    /// </summary>
    /// <param name="id">The ID of the message.</param>
    /// <returns>The response.</returns>
    [HttpDelete("messages/{id}")]
    public async Task<IActionResult> DeleteMessageAsync(string id)
    {
        var authInfo = await _auth.GetAuthorizationInfo(Request).ConfigureAwait(false);
        if (!authInfo.IsAuthenticated || authInfo.UserId == Guid.Empty || authInfo.IsApiKey)
        {
            return Unauthorized();
        }

        _logger.LogInformation("Deleted message {Id}", id);
        _dismissedStore.Write(
            new Dismissed(Guid.NewGuid().ToString(), id, authInfo.UserId.ToString())
        );

        return NoContent();
    }

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/home.js")]
    [AllowAnonymous]
    public IActionResult ClientJs()
    {
        string resourceName = "Jellyfin.Plugin.HomeMessage.Web.js.build.home.js";
        using var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
        if (s is null)
        {
            _logger.LogError("Could not find embedded resource {Resource}", resourceName);
            return NotFound();
        }

        using var r = new StreamReader(s);
        Response.Headers.CacheControl = "no-store"; // dev-friendly

        return Content(r.ReadToEnd(), "application/javascript");
    }
}
