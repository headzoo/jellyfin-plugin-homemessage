using FluentAssertions;
using Jellyfin.Data.Entities;
using Jellyfin.Plugin.HomeMessage.Html;
using Jellyfin.Plugin.HomeMessage.Models;
using Jellyfin.Plugin.HomeMessage.Models.Dto;
using Jellyfin.Plugin.HomeMessage.Store;
using MediaBrowser.Controller.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.HomeMessage.Tests.Html;

/// <summary>
/// Tests for the <see cref="HtmlSafety"/> class.
/// </summary>
public class HtmlSafetyTest
{
    /// <summary>
    /// Tests the <see cref="HtmlSafety.SanitizeHtml"/> method.
    /// </summary>
    [Fact]
    public void SanitizeHtml_ReturnsExpected()
    {
        // Arrange
        var html = "<p>Hello <strong>world</strong></p>";
        var expected = "<p>Hello <strong>world</strong></p>";

        // Act
        var result = HtmlSafety.SanitizeHtml(html);

        // Assert
        result.Should().Be(expected);
    }

    /// <summary>
    /// Tests the <see cref="HtmlSafety.SanitizeHtml"/> method.
    /// </summary>
    [Fact]
    public void SanitizeHtml_ReturnsExpectedWithUnsafeTags()
    {
        // Arrange
        var html = "<p>Hello <script>alert('world')</script></p>";
        var expected = "<p>Hello alert('world')</p>";

        // Act
        var result = HtmlSafety.SanitizeHtml(html);

        // Assert
        result.Should().Be(expected);
    }

    /// <summary>
    /// Tests the <see cref="HtmlSafety.SanitizeHtml"/> method.
    /// </summary>
    [Fact]
    public void SanitizeHtml_ReturnsExpectedHrefAttribute()
    {
        // Arrange
        var html = "<p>Hello <a href='https://www.google.com'>world</a></p>";
        var expected = "<p>Hello <a href=\"https://www.google.com\">world</a></p>";

        // Act
        var result = HtmlSafety.SanitizeHtml(html);

        // Assert
        result.Should().Be(expected);
    }

    /// <summary>
    /// Tests the <see cref="HtmlSafety.SanitizeHtml"/> method.
    /// </summary>
    [Fact]
    public void SanitizeHtml_ReturnsExpectedWithUnsafeAttributes()
    {
        // Arrange
        var html = "<p>Hello <a href='javascript:alert(\"world\")'>world</a></p>";
        var expected = "<p>Hello <a>world</a></p>";

        // Act
        var result = HtmlSafety.SanitizeHtml(html);

        // Assert
        result.Should().Be(expected);
    }

    /// <summary>
    /// Tests the <see cref="HtmlSafety.SanitizeHtml"/> method.
    /// </summary>
    [Fact]
    public void SanitizeHtml_ReturnsExpectedWithAllowedTags()
    {
        // Arrange
        var html = "<p>Hello <strong>world</strong></p>";
        var expected = "Hello <strong>world</strong>";

        // Act
        var result = HtmlSafety.SanitizeHtml(html, ["strong"]);

        // Assert
        result.Should().Be(expected);
    }

    /// <summary>
    /// Tests the <see cref="HtmlSafety.SanitizeHtml"/> method.
    /// </summary>
    [Fact]
    public void SanitizeHtml_ReturnsExpectedWithAllowedSchemes()
    {
        // Arrange
        var html = "<p>Hello <a href='https://www.google.com'>world</a></p>";
        var expected = "<p>Hello <a href=\"https://www.google.com\">world</a></p>";

        // Act
        var result = HtmlSafety.SanitizeHtml(html, allowedSchemes: new[] { "https" });

        // Assert
        result.Should().Be(expected);
    }

    /// <summary>
    /// Tests the <see cref="HtmlSafety.SanitizeHtml"/> method.
    /// </summary>
    [Fact]
    public void SanitizeHtml_ReturnsExpectedWithDisallowedTags()
    {
        // Arrange
        var html = "<p>Hello <script>alert('world')</script></p>";
        var expected = "<p>Hello </p>";

        // Act
        var result = HtmlSafety.SanitizeHtml(html, unwrapDisallowed: false);

        // Assert
        result.Should().Be(expected);
    }
}
