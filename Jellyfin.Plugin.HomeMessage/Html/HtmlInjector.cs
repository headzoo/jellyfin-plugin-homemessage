using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using AngleSharp;
using AngleSharp.Dom;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.HomeMessage.Html;

/// <summary>
/// Injects the CSS and JavaScript into the home page.
/// </summary>
/// <param name="applicationPaths">Instance of the <see cref="IApplicationPaths"/> interface.</param>
/// <param name="logger">Instance of the <see cref="ILogger"/> interface.</param>
public class HtmlInjector(IApplicationPaths applicationPaths, ILogger<HtmlInjector> logger)
    : IHtmlInjector
{
    /// <summary>
    /// Instance of the <see cref="IApplicationPaths"/> interface.
    /// </summary>
    private readonly IApplicationPaths _applicationPaths = applicationPaths;

    /// <summary>
    /// Gets the logger instance.
    /// </summary>
    private readonly ILogger _logger = logger;

    /// <inheritdoc />
    public async void Inject()
    {
        var indexFile = GetIndexFilePath();
        if (string.IsNullOrWhiteSpace(indexFile))
        {
            return;
        }

        var document = await GetDomDocument(indexFile).ConfigureAwait(false);
        var body = document.QuerySelector("body");
        if (body == null)
        {
            _logger.LogError("Could not find body element in {File}", indexFile);
            return;
        }

        InjectScript(document, body);
        InjectStyles(document, body);
        File.WriteAllText(indexFile, document.DocumentElement.OuterHtml);
        _logger.LogInformation("Injected scripts and styles into {File}.", indexFile);
    }

    /// <inheritdoc />
    public async void Cleanup()
    {
        var indexFile = GetIndexFilePath();
        if (string.IsNullOrWhiteSpace(indexFile))
        {
            return;
        }

        var document = await GetDomDocument(indexFile).ConfigureAwait(false);
        var body = document.QuerySelector("body");
        if (body == null)
        {
            _logger.LogError("Could not find body element in {File}", indexFile);
            return;
        }

        var foundJs = body.QuerySelector("#home-message-script");
        foundJs?.Remove();
        var foundCss = body.QuerySelector("#home-message-styles");
        foundCss?.Remove();

        File.WriteAllText(indexFile, document.DocumentElement.OuterHtml);
        _logger.LogInformation("Cleaned up scripts and styles from {File}.", indexFile);
    }

    /// <summary>
    /// Injects the script into the home page.
    /// </summary>
    /// <remarks>
    /// Adds the boot.js script to the home page, which in turn waits for the
    /// page to finish loading, then calls the home.js script.
    /// </remarks>
    /// <param name="document">The document.</param>
    /// <param name="body">The body.</param>
    private void InjectScript(IDocument document, IElement body)
    {
        using var r = GetAssemblyStream("js.build.boot.js");
        if (r is null)
        {
            return;
        }

        var foundJs = body.QuerySelector("#home-message-script");
        foundJs?.Remove();

        var script = document.CreateElement("script");
        script.Id = "home-message-script";
        script.SetAttribute("type", "text/javascript");
        script.InnerHtml = r.ReadToEnd();

        body.AppendChild(script);
        _logger.LogInformation("Injected script");
    }

    /// <summary>
    /// Injects the styles into the home page.
    /// </summary>
    /// <remarks>
    /// Adds the home.css stylesheet to the home page.
    /// </remarks>
    /// <param name="document">The document.</param>
    /// <param name="body">The body.</param>
    private void InjectStyles(IDocument document, IElement body)
    {
        using var r = GetAssemblyStream("css.build.home.css");
        if (r is null)
        {
            return;
        }

        var foundCss = body.QuerySelector("#home-message-styles");
        foundCss?.Remove();

        var style = document.CreateElement("style");
        style.Id = "home-message-styles";
        style.SetAttribute("type", "text/css");
        style.InnerHtml = r.ReadToEnd();

        body.AppendChild(style);
        _logger.LogInformation("Injected styles");
    }

    /// <summary>
    /// Gets the embedded resource stream.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <returns>The stream.</returns>
    private StreamReader? GetAssemblyStream(string resourceName)
    {
        var s = Assembly
            .GetExecutingAssembly()
            .GetManifestResourceStream("Jellyfin.Plugin.HomeMessage.Web." + resourceName);
        if (s is null)
        {
            _logger.LogError("Could not find embedded resource {Resource}", resourceName);
            return null;
        }

        return new StreamReader(s);
    }

    /// <summary>
    /// Gets the full file path to the index.html file.
    /// </summary>
    /// <returns>The index file path.</returns>
    private string GetIndexFilePath()
    {
        if (string.IsNullOrWhiteSpace(_applicationPaths.WebPath))
        {
            _logger.LogError("Could not find web path");
            return string.Empty;
        }

        var indexFile = Path.Combine(_applicationPaths.WebPath, "index.html");
        if (!File.Exists(indexFile))
        {
            _logger.LogError("Could not find index.html");
            return string.Empty;
        }

        return indexFile;
    }

    /// <summary>
    /// Gets the DOM document for the given file.
    /// </summary>
    /// <param name="indexFile">The index file.</param>
    /// <returns>The document.</returns>
    private static async Task<IDocument> GetDomDocument(string indexFile)
    {
        var context = BrowsingContext.New(AngleSharp.Configuration.Default);
        string indexContents = await File.ReadAllTextAsync(indexFile).ConfigureAwait(false);
        var document = await context
            .OpenAsync(req => req.Content(indexContents))
            .ConfigureAwait(false);

        return document;
    }
}
