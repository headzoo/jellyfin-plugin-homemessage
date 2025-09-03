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
    where T : IHasId
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
    public void Add(T obj)
    {
        _cache.Add(obj);
        File.WriteAllText(_dbPath, JsonSerializer.Serialize(_cache, _jsonOptions));
    }

    /// <inheritdoc />
    public void Update(T obj)
    {
        var existing =
            _cache.FirstOrDefault(m => m.Id == obj.Id)
            ?? throw new InvalidOperationException("Object not found in cache");
        _cache.Remove(existing);
        _cache.Add(obj);
        File.WriteAllText(_dbPath, JsonSerializer.Serialize(_cache));
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
        File.WriteAllText(_dbPath, JsonSerializer.Serialize(_cache));
    }
}
