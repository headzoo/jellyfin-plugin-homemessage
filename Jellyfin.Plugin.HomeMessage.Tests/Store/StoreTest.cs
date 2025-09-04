using FluentAssertions;
using MediaBrowser.Controller;
using Moq;

namespace Jellyfin.Plugin.HomeMessage.Tests.Store;

/// <summary>
/// Tests for the <see cref="HomeMessageController"/> class.
/// </summary>
public class StoreTests : IDisposable
{
    /// <inheritdoc />
    public void Dispose()
    {
        var store = CreateStore();
        store.CleanUp();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Tests the <see cref="Store.Add"/> method.
    /// </summary>
    [Fact]
    public void Add_ReturnsObject()
    {
        var store = CreateStore();
        var obj = new StoreModel("Test");
        var obj2 = store.Add(obj);
        obj2.Should().NotBeNull();
        obj2.Id.Should().NotBeEmpty();
        obj2.CreatedTime.Should().BeGreaterThan(0);
    }

    /// <summary>
    /// Tests the <see cref="Store.Update"/> method.
    /// </summary>
    [Fact]
    public void Update_ReturnsObject()
    {
        var store = CreateStore();
        var obj = new StoreModel("Test");
        store.Add(obj);

        var obj2 = new StoreModel("Test2");
        store.Update(obj.Id, obj2);

        var result = store.GetById(obj.Id);
        result.Should().NotBeNull();
        result!.Should().BeEquivalentTo(obj2);
    }

    /// <summary>
    /// Tests the <see cref="Store.GetById"/> method.
    /// </summary>
    [Fact]
    public void GetById_ReturnsObject()
    {
        var store = CreateStore();
        var obj = new StoreModel("Test");
        store.Add(obj);

        var result = store.GetById(obj.Id);
        result.Should().NotBeNull();
        result!.Should().BeEquivalentTo(obj);
    }

    /// <summary>
    /// Tests the <see cref="Store.GetAll"/> method.
    /// </summary>
    [Fact]
    public void GetAll_ReturnsObject()
    {
        var store = CreateStore();
        var obj1 = new StoreModel("Test");
        store.Add(obj1);
        var obj2 = new StoreModel("Test2");
        store.Add(obj2);

        var result = store.GetAll();
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.First().Should().BeEquivalentTo(obj1);
        result.Last().Should().BeEquivalentTo(obj2);
    }

    /// <summary>
    /// Tests the <see cref="Store.Remove"/> method.
    /// </summary>
    [Fact]
    public void Remove_ReturnsObject()
    {
        var store = CreateStore();
        var obj = new StoreModel("Test");
        store.Add(obj);

        store.Remove(obj.Id);

        var result = store.GetAll();
        result.Should().BeEmpty();
    }

    /// <summary>
    /// Creates a new store.
    /// </summary>
    /// <returns>A new store.</returns>
    private static StoreImpl CreateStore()
    {
        var applicationPaths = new Mock<IServerApplicationPaths>();
        applicationPaths.Setup(a => a.DataPath).Returns("test");

        return new StoreImpl(applicationPaths.Object, "test.json");
    }
}
