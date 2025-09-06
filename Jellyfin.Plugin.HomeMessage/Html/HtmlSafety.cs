using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;

namespace Jellyfin.Plugin.HomeMessage.Html;

/// <summary>
/// Provides HTML sanitization.
/// </summary>
public static partial class HtmlSafety
{
    /// <summary>
    /// The default allowed tags.
    /// </summary>
    private static readonly HashSet<string> _defaultAllowedTags = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        "b",
        "i",
        "u",
        "s",
        "a",
        "strong",
        "em",
        "p",
        "br",
    };

    /// <summary>
    /// The default allowed schemes.
    /// </summary>
    private static readonly HashSet<string> _defaultAllowedSchemes = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        "http",
        "https",
        "mailto",
        "tel",
    };

    /// <summary>
    /// Strip HTML except for an allowlist of tags. Disallowed tags are unwrapped (children kept).
    /// For &lt;a&gt;, only safe href values are preserved.
    /// </summary>
    /// <param name="html">The HTML.</param>
    /// <param name="allowedTags">The allowed tags.</param>
    /// <param name="allowedAttrs">The allowed attributes.</param>
    /// <param name="allowedSchemes">The allowed schemes.</param>
    /// <param name="unwrapDisallowed">Whether to unwrap disallowed tags.</param>
    /// <returns>The sanitized HTML.</returns>
    public static string SanitizeHtml(
        string? html,
        IEnumerable<string>? allowedTags = null,
        IDictionary<string, string[]>? allowedAttrs = null,
        IEnumerable<string>? allowedSchemes = null,
        bool unwrapDisallowed = true
    )
    {
        if (string.IsNullOrEmpty(html))
        {
            return string.Empty;
        }

        var tagSet = new HashSet<string>(
            (allowedTags ?? _defaultAllowedTags).Select(t => t.ToLowerInvariant()),
            StringComparer.OrdinalIgnoreCase
        );

        var schemeSet = new HashSet<string>(
            (allowedSchemes ?? _defaultAllowedSchemes).Select(s => s.ToLowerInvariant()),
            StringComparer.OrdinalIgnoreCase
        );

        // Default: only <a href>
        allowedAttrs ??= new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["a"] = ["href"],
        };

        // Build a tiny document with a root container and set InnerHtml (AngleSharp parses it)
        var parser = new HtmlParser();
        var doc = parser.ParseDocument("<div id='root'></div>");
        var root = doc.GetElementById("root")!;
        root.InnerHtml = html;

        // Remove comments (optional, keeps things tidy)
        RemoveComments(root);

        // Walk all elements (snapshot to avoid live-list mutation issues)
        var elements = root.QuerySelectorAll("*").OfType<IElement>().ToList();

        foreach (var el in elements)
        {
            var tag = el.TagName.ToLowerInvariant();

            if (!tagSet.Contains(tag))
            {
                if (unwrapDisallowed)
                {
                    Unwrap(el);
                }
                else
                {
                    el.Remove();
                }

                continue;
            }

            // Allowed element: prune attributes
            var allowedForTag = new HashSet<string>(
                allowedAttrs.TryGetValue(tag, out var attrs)
                    ? attrs.Select(a => a.ToLowerInvariant())
                    : Enumerable.Empty<string>(),
                StringComparer.OrdinalIgnoreCase
            );

            // Copy attribute list first, then mutate
            foreach (var attr in el.Attributes.ToArray())
            {
                var name = attr.Name.ToLowerInvariant();

                if (!allowedForTag.Contains(name))
                {
                    el.RemoveAttribute(attr.Name);
                    continue;
                }

                // Extra checks for href on <a>
                if (tag == "a" && name == "href")
                {
                    var hrefVal = el.GetAttribute("href") ?? string.Empty;
                    if (!IsSafeUrl(hrefVal, schemeSet))
                    {
                        el.RemoveAttribute("href");
                    }
                }
            }
        }

        return root.InnerHtml;
    }

    /// <summary>
    /// Removes comments from the HTML.
    /// </summary>
    /// <param name="root">The root element.</param>
    private static void RemoveComments(INode root)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        foreach (var node in root.Descendents().ToList())
        {
            if (node.NodeType == NodeType.Comment)
            {
                if (node is IChildNode child)
                {
                    child.Remove(); // preferred
                }
                else
                {
                    node.Parent?.RemoveChild(node); // fallback
                }
            }
        }
#pragma warning restore CS0618 // Type or member is obsolete
    }

    /// <summary>
    /// Unwraps a single element.
    /// </summary>
    /// <param name="el">The element.</param>
    private static void Unwrap(IElement el)
    {
        var parent = el.Parent;
        if (parent is null)
        {
            el.Remove();
            return;
        }

        while (el.HasChildNodes)
        {
            var child = el.FirstChild!;
            parent.InsertBefore(child, el);
        }

        el.Remove();
    }

    /// <summary>
    /// Checks if a URL is safe.
    /// </summary>
    private static bool IsSafeUrl(string url, HashSet<string> allowedSchemes)
    {
        var u = System.Net.WebUtility.HtmlDecode(url).Trim();
        if (string.IsNullOrEmpty(u))
        {
            return false;
        }

        // Absolute with scheme?
        var m = MyRegex().Match(u);
        if (m.Success)
        {
            var scheme = m.Groups[1].Value.ToLowerInvariant();
            return allowedSchemes.Contains(scheme);
        }

        // No scheme => relative URL; allow it
        return true;
    }

    /// <summary>Gets the regex for matching URLs.</summary>
    [GeneratedRegex(@"^\s*([a-zA-Z][a-zA-Z0-9+\-.]*):")]
    private static partial Regex MyRegex();
}
