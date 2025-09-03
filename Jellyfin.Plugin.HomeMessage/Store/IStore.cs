namespace Jellyfin.Plugin.HomeMessage.Store;

/// <summary>
/// Interface for a store.
/// </summary>
/// <typeparam name="T">The type of the object to store.</typeparam>
public interface IStore<T>
    where T : IHasId
{
    /// <summary>
    /// Adds the given object to the cache and writes it to the database.
    /// </summary>
    /// <param name="obj">The object to add.</param>
    void Add(T obj);

    /// <summary>
    /// Gets the message with the given ID.
    /// </summary>
    /// <param name="id">The ID of the message.</param>
    /// <returns>The message.</returns>
    T? GetById(string id);

    /// <summary>
    /// Gets all dismissed state from the database.
    /// </summary>
    /// <returns>The dismissed state.</returns>
    T[] GetAll();

    /// <summary>
    /// Removes the given object from the cache and writes it to the database.
    /// </summary>
    /// <param name="id">The ID of the object to remove.</param>
    void Remove(string id);

    /// <summary>
    /// Updates the given object in the cache and writes it to the database.
    /// </summary>
    /// <param name="obj">The object to update.</param>
    void Update(T obj);
}
