using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using MediaBrowser.Controller;

namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Base class for stores.
/// </summary>
/// <typeparam name="T">The type of the object to store.</typeparam>
public abstract class Store<T>
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
    /// Adds the given object to the cache and writes it to the database.
    /// </summary>
    /// <param name="obj">The object to add.</param>
    protected void Write(T obj)
    {
        _cache.Add(obj);
        File.WriteAllText(_dbPath, JsonSerializer.Serialize(_cache));
    }

    /// <summary>
    /// Removes the given object from the cache and writes it to the database.
    /// </summary>
    /// <param name="id">The ID of the object to remove.</param>
    protected void Remove(string id)
    {
        _cache.RemoveAll(m => m.Id == id);
        File.WriteAllText(_dbPath, JsonSerializer.Serialize(_cache));
    }
}
