using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Jellyfin.Plugin.HomeMessage.Models;
using Jellyfin.Plugin.HomeMessage.Models.Dto;
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
    IMessageStore messageStore,
    IDismissedStore dismissedStore
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
    private readonly IMessageStore _messageStore = messageStore;

    /// <summary>
    /// Gets the dismissed store.
    /// </summary>
    private readonly IDismissedStore _dismissedStore = dismissedStore;

    /// <summary>
    /// Require a logged-in session (the home screen is behind auth anyway).
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("config/messages")]
    [Authorize]
    public ActionResult GetMessages()
    {
        return Ok(_messageStore.GetAll());
    }

    /// <summary>
    /// Save the configuration.
    /// </summary>
    /// <param name="req">The request body.</param>
    /// <returns>The response.</returns>
    [HttpPost("config/messages")]
    [Authorize(Policy = "RequiresElevation")]
    public ActionResult SaveMessage([FromBody] MessageInput req)
    {
        if (req is null)
        {
            return BadRequest();
        }

        var message = new Message(
            Guid.NewGuid().ToString(),
            req.Title,
            req.Text,
            req.Dismissible,
            req.BgColor,
            req.TextColor,
            req.TimeStart,
            req.TimeEnd,
            DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        );
        _messageStore.Add(message);
        _logger.LogInformation("Saved message {Id}", message.Id);

        return Ok(message);
    }

    /// <summary>
    /// Updates an existing message.
    /// </summary>
    /// <param name="req">The message input.</param>
    /// <param name="id">The ID of the message.</param>
    /// <returns>The response.</returns>
    [HttpPost("config/messages/{id}")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult UpdateMessage([FromBody] MessageInput req, string id)
    {
        if (req is null)
        {
            return BadRequest();
        }

        var message = _messageStore.GetById(id);
        if (message is null)
        {
            return NotFound();
        }

        var updated = new Message(
            message.Id,
            req.Title,
            req.Text,
            req.Dismissible,
            req.BgColor,
            req.TextColor,
            req.TimeStart,
            req.TimeEnd,
            message.CreatedTime
        );
        _messageStore.Update(updated);
        _logger.LogInformation("Updated message {Id}", id);

        return Ok(updated);
    }

    /// <summary>
    /// Deletes a message.
    /// </summary>
    /// <param name="id">The ID of the message.</param>
    /// <returns>The response.</returns>
    [HttpDelete("config/messages/{id}")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult DeleteMessage(string id)
    {
        _logger.LogInformation("Deleted message {Id}", id);
        _messageStore.Remove(id);

        return Ok("Message deleted");
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
    [Authorize]
    public async Task<IActionResult> DismissMessageAsync(string id)
    {
        var authInfo = await _auth.GetAuthorizationInfo(Request).ConfigureAwait(false);
        if (!authInfo.IsAuthenticated || authInfo.UserId == Guid.Empty || authInfo.IsApiKey)
        {
            return Unauthorized();
        }

        _logger.LogInformation("Dismissed message {Id}", id);
        _dismissedStore.Add(
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

    /// <summary>
    /// Gets the client-side JavaScript.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("js/build/config.js")]
    [AllowAnonymous]
    public IActionResult GetConfigJs()
    {
        string resourceName = "Jellyfin.Plugin.HomeMessage.Web.js.build.config.js";
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
