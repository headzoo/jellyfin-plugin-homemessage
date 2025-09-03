using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Plugin.HomeMessage.Store;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage.ScheduledTasks;

/// <summary>
/// Expires old messages.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ExpireMessagesTask"/> class.
/// </remarks>
/// <param name="logger">Instance of the <see cref="ILogger{TCategoryName}"/> interface.</param>
/// <param name="store">Instance of the <see cref="IMessageStore"/> class.</param>
public class ExpireMessagesTask(ILogger<ExpireMessagesTask> logger, IMessageStore store)
    : IScheduledTask
{
    /// <summary>
    /// The logger.
    /// </summary>
    private readonly ILogger<ExpireMessagesTask> _logger = logger;

    /// <summary>
    /// The message store.
    /// </summary>
    private readonly IMessageStore _store = store;

    /// <summary>
    /// Gets the key of the task.
    /// </summary>
    public string Key => "HomeMessage.Expires";

    /// <summary>
    /// Gets the category of the task.
    /// </summary>
    public string Category => "Maintenance";

    /// <summary>
    /// Gets the name of the task.
    /// </summary>
    public string Name => "Clean Expired Home Messages";

    /// <summary>
    /// Gets the description of the task.
    /// </summary>
    public string Description => "Deletes messages that are older than the configured expiration.";

    /// <summary>
    /// Executes the task.
    /// </summary>
    /// <param name="progress">The progress.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The task.</returns>
    public Task ExecuteAsync(IProgress<double> progress, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Executing task {Name}", Name);

        var expiration = Plugin.Instance?.Configuration.Expiration ?? 0;
        if (expiration == 0)
        {
            _logger.LogInformation("Task {Name} is disabled", Name);
            return Task.CompletedTask;
        }

        progress?.Report(0);

        var messages = _store.GetOlderThanDays(expiration);
        foreach (var message in messages)
        {
            _logger.LogInformation("Deleting message {Id}", message.Id);
            _store.Remove(message.Id);
        }

        progress?.Report(100);

        return Task.CompletedTask;
    }

    /// <summary>
    /// Gets the default triggers.
    /// </summary>
    /// <returns>The default triggers.</returns>
    public IEnumerable<TaskTriggerInfo> GetDefaultTriggers() =>
        [
            new TaskTriggerInfo
            {
                Type = TaskTriggerInfo.TriggerDaily,
                TimeOfDayTicks = new TimeSpan(3, 0, 0).Ticks, // 03:00 server-local time
            },
        ];
}
