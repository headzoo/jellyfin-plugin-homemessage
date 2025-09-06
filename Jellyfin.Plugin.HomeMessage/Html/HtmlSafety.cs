using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Ganss.Xss;

namespace Jellyfin.Plugin.HomeMessage.Html;

/// <summary>
/// Provides HTML sanitization.
/// </summary>
public static class HtmlSafety
{
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
    /// Sanitizes the HTML.
    /// </summary>
    /// <param name="html">The HTML.</param>
    /// <param name="allowedTags">The allowed tags.</param>
    /// <param name="allowedSchemes">The allowed schemes.</param>
    /// <param name="unwrapDisallowed">Whether to unwrap disallowed tags.</param>
    /// <param name="allowBr">Whether to allow <c>br</c> tags.</param>
    /// <returns>The sanitized HTML.</returns>
    public static string SanitizeHtml(
        string? html,
        IEnumerable<string>? allowedTags = null,
        IEnumerable<string>? allowedSchemes = null,
        bool unwrapDisallowed = true,
        bool allowBr = false
    )
    {
        if (string.IsNullOrEmpty(html))
        {
            return string.Empty;
        }

        var tags = new HashSet<string>(
            (allowedTags ?? _defaultAllowedTags).Select(t => t.ToLowerInvariant()),
            StringComparer.OrdinalIgnoreCase
        );

        if (allowBr)
        {
            tags.Add("br");
        }

        var schemes = new HashSet<string>(
            (allowedSchemes ?? _defaultAllowedSchemes).Select(s => s.ToLowerInvariant()),
            StringComparer.OrdinalIgnoreCase
        );

        var sanitizer = new HtmlSanitizer();

        sanitizer.AllowedTags.Clear();
        foreach (var t in tags)
        {
            sanitizer.AllowedTags.Add(t);
        }

        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedSchemes.Clear();
        foreach (var s in schemes)
        {
            sanitizer.AllowedSchemes.Add(s);
        }

        sanitizer.KeepChildNodes = unwrapDisallowed;

        sanitizer.RemovingAttribute += (s, e) =>
        {
            if (
                e.Attribute?.Name.Equals("href", StringComparison.OrdinalIgnoreCase) == true
                && string.Equals(e.Tag.TagName, "a", StringComparison.OrdinalIgnoreCase)
            )
            {
                var val = e.Attribute.Value ?? string.Empty;
                if (IsSafeUrl(val, schemes))
                {
                    e.Cancel = true; // keep it
                }
            }
        };

        return sanitizer.Sanitize(html);
    }

    private static bool IsSafeUrl(string url, HashSet<string> allowedSchemes)
    {
        var u = System.Net.WebUtility.HtmlDecode(url).Trim();
        if (string.IsNullOrEmpty(u))
        {
            return false;
        }

        var m = Regex.Match(u, @"^\s*([a-zA-Z][a-zA-Z0-9+\-.]*):");
        if (m.Success)
        {
            return allowedSchemes.Contains(m.Groups[1].Value.ToLowerInvariant());
        }

        // Relative URLs are considered safe
        return true;
    }
}
