using Jellyfin.Plugin.HomeMessage.Store;
using MediaBrowser.Controller;

namespace Jellyfin.Plugin.HomeMessage.Tests.Store;

/// <summary>
/// Implements the <see cref="Store{T}"/> class.
/// </summary>
/// <inheritdoc />
public class StoreImpl(IServerApplicationPaths paths, string filename)
    : HomeMessage.Store.Store<StoreModel>(paths, filename) { }
