using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using MediaBrowser.Controller;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Base class for stores.
/// </summary>
/// <typeparam name="T">The type of the object to store.</typeparam>
public abstract class Store<T> : IStore<T>
    where T : IModel
{
    /// <summary>
    /// Gets the cache.
    /// </summary>
    private readonly List<T> _cache = [];

    /// <summary>
    /// Gets the database path.
    /// </summary>
    private readonly string _dbPath;

    /// <summary>
    /// The JSON options.
    /// </summary>
    private static readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

    /// <summary>
    /// Initializes a new instance of the <see cref="Store{T}"/> class.
    /// </summary>
    /// <param name="paths">Instance of the <see cref="IServerApplicationPaths"/> interface.</param>
    /// <param name="filename">The filename of the database.</param>
    protected Store(IServerApplicationPaths paths, string filename)
    {
        ArgumentNullException.ThrowIfNull(paths);

        var dir = Path.Combine(paths.DataPath, "plugins", "HomeMessage");
        Directory.CreateDirectory(dir);
        _dbPath = Path.Combine(dir, filename);
        if (File.Exists(_dbPath))
        {
            _cache = JsonSerializer.Deserialize<List<T>>(File.ReadAllText(_dbPath)) ?? [];
        }
    }

    /// <summary>
    /// Gets the cache.
    /// </summary>
    protected IReadOnlyList<T> Cache => _cache;

    /// <summary>
    /// Deletes all files created by the class.
    /// </summary>
    public void CleanUp()
    {
        File.Delete(_dbPath);
    }

    /// <inheritdoc />
    public T? GetById(string id)
    {
        return _cache.FirstOrDefault(m => m.Id == id);
    }

    /// <inheritdoc />
    public T[] GetAll()
    {
        return [.. _cache];
    }

    /// <inheritdoc />
    public T Add(T obj)
    {
        obj.Id = GenerateId();
        obj.CreatedTime = GetUnixTime();
        _cache.Add(obj);
        FlushCache();

        return obj;
    }

    /// <inheritdoc />
    public void Update(string id, T obj)
    {
        var existing =
            _cache.FirstOrDefault(m => m.Id == id)
            ?? throw new InvalidOperationException("Object not found in cache");

        obj.Id = existing.Id;
        obj.CreatedTime = existing.CreatedTime;
        _cache.Remove(existing);
        _cache.Add(obj);

        FlushCache();
    }

    /// <inheritdoc />
    public void Remove(string id)
    {
        var removed = _cache.RemoveAll(m => m.Id == id);
        Plugin.Instance?.Logger.Log(
            LogLevel.Information,
            "Removed {Count} message(s) from cache",
            removed
        );
        FlushCache();
    }

    /// <summary>
    /// Generates a new unique ID.
    /// </summary>
    /// <returns>A new unique ID.</returns>
    protected string GenerateId()
    {
        return Guid.NewGuid().ToString();
    }

    /// <summary>
    /// Gets the current Unix timestamp.
    /// </summary>
    /// <returns>The current Unix timestamp.</returns>
    protected long GetUnixTime()
    {
        return DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    }

    /// <summary>
    /// Flushes the cache to disk.
    /// </summary>
    private void FlushCache()
    {
        File.WriteAllText(_dbPath, JsonSerializer.Serialize(_cache, _jsonOptions));
    }
}
