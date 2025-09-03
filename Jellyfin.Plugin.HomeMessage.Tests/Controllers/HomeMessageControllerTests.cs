using FluentAssertions;
using Jellyfin.Data.Entities;
using Jellyfin.Plugin.HomeMessage.Controllers;
using Jellyfin.Plugin.HomeMessage.Models;
using Jellyfin.Plugin.HomeMessage.Models.Dto;
using Jellyfin.Plugin.HomeMessage.Store;
using MediaBrowser.Controller.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.HomeMessage.Tests.Controllers;

/// <summary>
/// Tests for the <see cref="HomeMessageController"/> class.
/// </summary>
public class HomeMessageControllerTests
{
    /// <summary>
    /// Tests the <see cref="HomeMessageController.GetMessages"/> method.
    /// </summary>
    [Fact]
    public void GetMessages_ReturnsOkObjectResult()
    {
        // Arrange
        var auth = GetMockAuth();
        var messageStore = new Mock<IMessageStore>(MockBehavior.Strict);
        var dismissedStore = new Mock<IDismissedStore>(MockBehavior.Strict);
        var logger = new Mock<ILogger<HomeMessageController>>();
        var controller = new HomeMessageController(
            auth.Object,
            logger.Object,
            messageStore.Object,
            dismissedStore.Object
        );

        var msg1 = new Message(
            Title: "Hello",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        )
        {
            Id = "id1",
            CreatedTime = 0,
        };

        var msg2 = new Message(
            Title: "Bye",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        )
        {
            Id = "id2",
            CreatedTime = 0,
        };

        var messages = new[] { msg1, msg2 };
        messageStore.Setup(s => s.GetAll()).Returns(messages);

        // Act
        var result = controller.GetMessages();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result;
        ok.Value.Should()
            .BeAssignableTo<IEnumerable<Message>>()
            .Which.Should()
            .BeEquivalentTo(messages);
    }

    /// <summary>
    /// Tests the <see cref="HomeMessageController.SaveMessage"/> method.
    /// </summary>
    [Fact]
    public void SaveMessage_AndReturnsOkObjectResult()
    {
        // Arrange
        var auth = GetMockAuth();
        var messageStore = new Mock<IMessageStore>(MockBehavior.Strict);
        var dismissedStore = new Mock<IDismissedStore>(MockBehavior.Strict);
        var logger = new Mock<ILogger<HomeMessageController>>();
        var controller = new HomeMessageController(
            auth.Object,
            logger.Object,
            messageStore.Object,
            dismissedStore.Object
        );

        var msg = new MessageInput(
            Title: "Hello",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        );

        messageStore.Setup(s => s.Add(It.Is<Message>(m => m.Title == "Hello")));

        // Act
        var result = controller.SaveMessage(msg);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        messageStore.Verify(s => s.Add(It.IsAny<Message>()), Times.Once); // verify interaction
    }

    /// <summary>
    /// Tests the <see cref="HomeMessageController.UpdateMessage"/> method.
    /// </summary>
    [Fact]
    public void UpdateMessage_AndReturnsOkObjectResult()
    {
        // Arrange
        var auth = GetMockAuth();
        var messageStore = new Mock<IMessageStore>(MockBehavior.Strict);
        var dismissedStore = new Mock<IDismissedStore>(MockBehavior.Strict);
        var logger = new Mock<ILogger<HomeMessageController>>();
        var controller = new HomeMessageController(
            auth.Object,
            logger.Object,
            messageStore.Object,
            dismissedStore.Object
        );

        var msg1 = new Message(
            Title: "Hello",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        )
        {
            Id = "id1",
            CreatedTime = 0,
        };

        messageStore.Setup(s => s.GetById("id1")).Returns(msg1);
        messageStore.Setup(s =>
            s.Update(It.Is<string>(m => m == "id1"), It.Is<Message>(m => m.Title == "Goodbye"))
        );

        // Act
        var inputMessage = new MessageInput(
            Title: "Goodbye",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        );
        var result = controller.UpdateMessage(inputMessage, "id1");

        var msg2 = new Message(
            Title: "Goodbye",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        )
        {
            Id = "id1",
            CreatedTime = 0,
        };

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result;
        ok.Value.Should().BeAssignableTo<Message>().Which.Should().BeEquivalentTo(msg2);
    }

    /// <summary>
    /// Tests the <see cref="HomeMessageController.DeleteMessage"/> method.
    /// </summary>
    [Fact]
    public void DeleteMessage_AndReturnsNoContentResult()
    {
        // Arrange
        var auth = GetMockAuth();
        var messageStore = new Mock<IMessageStore>(MockBehavior.Strict);
        var dismissedStore = new Mock<IDismissedStore>(MockBehavior.Strict);
        var logger = new Mock<ILogger<HomeMessageController>>();
        var controller = new HomeMessageController(
            auth.Object,
            logger.Object,
            messageStore.Object,
            dismissedStore.Object
        );

        var msg1 = new Message(
            Title: "Hello",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        )
        {
            Id = "id1",
            CreatedTime = 0,
        };

        messageStore.Setup(s => s.GetById("id1")).Returns(msg1);
        messageStore.Setup(s => s.Remove("id1"));

        // Act
        var result = controller.DeleteMessage("id1");

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        messageStore.Verify(s => s.Remove("id1"), Times.Once); // verify interaction
    }

    /// <summary>
    /// Tests the <see cref="HomeMessageController.DismissMessageAsync"/> method.
    /// </summary>
    [Fact]
    public async Task DismissMessage_AndReturnsNoContentResult()
    {
        // Arrange
        var auth = GetMockAuth();
        var messageStore = new Mock<IMessageStore>(MockBehavior.Strict);
        var dismissedStore = new Mock<IDismissedStore>(MockBehavior.Strict);
        var logger = new Mock<ILogger<HomeMessageController>>();
        var controller = new HomeMessageController(
            auth.Object,
            logger.Object,
            messageStore.Object,
            dismissedStore.Object
        );

        var msg1 = new Message(
            Title: "Hello",
            Text: "World",
            Dismissible: true,
            BgColor: "#000",
            TextColor: "#fff",
            TimeStart: null,
            TimeEnd: null
        )
        {
            Id = "id1",
            CreatedTime = 0,
        };

        messageStore.Setup(s => s.GetById("id1")).Returns(msg1);
        dismissedStore.Setup(s => s.Add(It.Is<Dismissed>(d => d.MessageId == "id1")));

        // Act
        var result = await controller.DismissMessageAsync("id1");

        // Assert
        result.Should().BeOfType<NoContentResult>();
        dismissedStore.Verify(s => s.Add(It.IsAny<Dismissed>()), Times.Once); // verify interaction
    }

    /// <summary>
    /// Gets the mock auth.
    /// </summary>
    private Mock<IAuthorizationContext> GetMockAuth()
    {
        var auth = new Mock<IAuthorizationContext>(MockBehavior.Strict);
        var userId = Guid.NewGuid();
        var jfUser = new User("testuser", "Manual", "Manual") { Id = userId };
        var authInfo = new AuthorizationInfo
        {
            User = jfUser,
            HasToken = true,
            IsAuthenticated = true,
        };
        auth.Setup(a => a.GetAuthorizationInfo(It.IsAny<HttpRequest>())).ReturnsAsync(authInfo);

        return auth;
    }
}
