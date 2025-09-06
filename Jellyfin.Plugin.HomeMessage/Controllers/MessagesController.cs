using System;
using System.Threading.Tasks;
using Jellyfin.Plugin.HomeMessage.Html;
using Jellyfin.Plugin.HomeMessage.Models;
using Jellyfin.Plugin.HomeMessage.Models.Dto;
using Jellyfin.Plugin.HomeMessage.Store;
using MediaBrowser.Controller.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage.Controllers;

/// <summary>
/// Controller for retrieving, creating, and dismissing messages.
/// </summary>
/// <param name="auth">Instance of the <see cref="IAuthorizationContext"/> interface.</param>
/// <param name="logger">Instance of the <see cref="ILogger{TCategoryName}"/> interface.</param>
/// <param name="messageStore">Instance of the <see cref="MessageStore"/> class.</param>
/// <param name="dismissedStore">Instance of the <see cref="DismissedStore"/> class.</param>
[ApiController]
[Route("HomeMessage")]
public class MessagesController(
    IAuthorizationContext auth,
    ILogger<MessagesController> logger,
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
    private readonly ILogger<MessagesController> _logger = logger;

    /// <summary>
    /// Gets the message store.
    /// </summary>
    private readonly IMessageStore _messageStore = messageStore;

    /// <summary>
    /// Gets the dismissed store.
    /// </summary>
    private readonly IDismissedStore _dismissedStore = dismissedStore;

    /// <summary>
    /// Returns all of the messages.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("admin/messages")]
    [Authorize(Policy = "RequiresElevation")]
    public ActionResult GetMessages()
    {
        return Ok(_messageStore.GetAll());
    }

    /// <summary>
    /// Creates a new message.
    /// </summary>
    /// <param name="req">The request body.</param>
    /// <returns>The response.</returns>
    [HttpPost("admin/messages")]
    [Authorize(Policy = "RequiresElevation")]
    public ActionResult SaveMessage([FromBody] MessageInput req)
    {
        if (req is null)
        {
            return BadRequest();
        }

        var message = new Message(
            req.Title,
            HtmlSafety.SanitizeHtml(req.Text),
            req.Dismissible,
            req.BgColor,
            req.TextColor,
            req.TimeStart,
            req.TimeEnd
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
    [HttpPost("admin/messages/{id}")]
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
            req.Title,
            HtmlSafety.SanitizeHtml(req.Text),
            req.Dismissible,
            req.BgColor,
            req.TextColor,
            req.TimeStart,
            req.TimeEnd
        );
        _messageStore.Update(message.Id, updated);
        _logger.LogInformation("Updated message {Id}", message.Id);

        return Ok(updated);
    }

    /// <summary>
    /// Deletes a message.
    /// </summary>
    /// <param name="id">The ID of the message.</param>
    /// <returns>The response.</returns>
    [HttpDelete("admin/messages/{id}")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult DeleteMessage(string id)
    {
        _logger.LogInformation("Deleted message {Id}", id);
        _messageStore.Remove(id);

        return Ok("Message deleted");
    }

    /// <summary>
    /// Returns the messages to display on the home page, excluding dismissed messages.
    /// </summary>
    /// <returns>The response.</returns>
    [HttpGet("messages")]
    [Authorize]
    public async Task<ActionResult> MessagesAsync()
    {
        var userId = await GetUserIdAsync().ConfigureAwait(false);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var dismissed = _dismissedStore.GetByUserId(userId);
        var messages = _messageStore.GetNotDismissed(dismissed);

        return Ok(messages);
    }

    /// <summary>
    /// Dismisses a message.
    /// </summary>
    /// <param name="id">The ID of the message.</param>
    /// <returns>The response.</returns>
    [HttpDelete("messages/{id}")]
    [Authorize]
    public async Task<IActionResult> DismissMessageAsync(string id)
    {
        var userId = await GetUserIdAsync().ConfigureAwait(false);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Dismissed message {Id}", id);
        _dismissedStore.Add(new Dismissed(id, userId));

        return NoContent();
    }

    /// <summary>
    /// Returns the ID of the authenticated user, or else returns an empty string.
    /// </summary>
    /// <returns>The user ID.</returns>
    private async Task<string> GetUserIdAsync()
    {
        var authInfo = await _auth.GetAuthorizationInfo(Request).ConfigureAwait(false);
        if (!authInfo.IsAuthenticated || authInfo.UserId == Guid.Empty || authInfo.IsApiKey)
        {
            return string.Empty;
        }

        return authInfo.UserId.ToString();
    }
}
