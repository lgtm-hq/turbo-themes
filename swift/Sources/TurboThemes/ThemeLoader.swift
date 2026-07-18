// SPDX-License-Identifier: MIT

import Foundation

/// Loads and provides access to theme definitions from bundled JSON.
public enum ThemeLoader {
    /// All available theme IDs, derived once from the bundled tokens.json
    /// (`meta.themeIds`, falling back to the theme dictionary keys).
    ///
    /// This convenience accessor is deliberately non-throwing for source
    /// compatibility and returns an empty array only in the exceptional case
    /// that the bundled resource cannot be loaded; call `loadThemes()` for a
    /// throwing API with a diagnosable error. Evaluated lazily exactly once
    /// (`static let` initialization is thread-safe), so repeated access takes
    /// no lock.
    public static let themeIds: [String] = {
        guard let themes = try? loadThemes() else { return [] }
        if let ids = themes.meta?.themeIds, !ids.isEmpty {
            return ids
        }
        return themes.themes.keys.sorted()
    }()

    /// Thread synchronization lock for cache access.
    private static let lock = NSLock()

    /// Cached loaded themes.
    private static var _themes: TurboThemes?

    /// Load all themes from bundled JSON resource.
    /// Thread-safe: uses locking to prevent data races during initialization.
    public static func loadThemes() throws -> TurboThemes {
        lock.lock()
        defer { lock.unlock() }

        if let cached = _themes {
            return cached
        }

        guard let url = Bundle.module.url(forResource: "tokens", withExtension: "json") else {
            throw ThemeLoaderError.resourceNotFound
        }

        let data = try Data(contentsOf: url)
        let themes = try TurboThemes(data: data)
        _themes = themes
        return themes
    }

    /// Get a specific theme by ID.
    public static func getTheme(_ id: String) throws -> ThemeValue? {
        let themes = try loadThemes()
        return themes.themes[id]
    }

    /// Get all themes as a dictionary.
    public static func getAllThemes() throws -> [String: ThemeValue] {
        return try loadThemes().themes
    }
}

/// Errors that can occur when loading themes.
public enum ThemeLoaderError: Error, LocalizedError {
    case resourceNotFound

    public var errorDescription: String? {
        switch self {
        case .resourceNotFound:
            return "tokens.json resource not found in bundle"
        }
    }
}
