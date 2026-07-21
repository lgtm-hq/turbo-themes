import XCTest
@testable import TurboThemes

final class ThemeRegistryTests: XCTestCase {

    // MARK: - Theme Count Tests

    func testAllThemeIdsMatchesCaseIterable() {
        XCTAssertEqual(ThemeRegistry.allThemeIds.count, ThemeId.allCases.count)
    }

    func testAllThemesAreRegistered() {
        // Every ThemeId should have a corresponding theme in the registry
        for themeId in ThemeId.allCases {
            XCTAssertNotNil(
                ThemeRegistry.themes[themeId],
                "Theme \(themeId.rawValue) is not registered"
            )
        }
    }

    func testExpectedThemeCount() {
        // We expect 36 themes based on the ThemeId enum
        XCTAssertEqual(ThemeId.allCases.count, 36)
        XCTAssertEqual(ThemeRegistry.allThemes.count, 36)
    }

    // MARK: - Theme Lookup Tests

    func testThemeForValidId() {
        let theme = ThemeRegistry.theme(for: .catppuccinMocha)
        XCTAssertNotNil(theme)
        XCTAssertEqual(theme?.id, .catppuccinMocha)
        XCTAssertEqual(theme?.label, "Catppuccin Mocha")
    }

    func testThemeLookupForAllIds() {
        for themeId in ThemeId.allCases {
            let theme = ThemeRegistry.theme(for: themeId)
            XCTAssertNotNil(theme, "Failed to lookup theme for \(themeId.rawValue)")
            XCTAssertEqual(theme?.id, themeId)
        }
    }

    // MARK: - Theme Label Tests

    func testThemeLabelsAreNotEmpty() {
        for theme in ThemeRegistry.allThemes {
            XCTAssertFalse(theme.label.isEmpty, "Theme \(theme.id.rawValue) has empty label")
        }
    }

    func testExpectedThemeLabels() {
        let expectedLabels: [ThemeId: String] = [
            .catppuccinMocha: "Catppuccin Mocha",
            .catppuccinLatte: "Catppuccin Latte",
            .catppuccinFrappe: "Catppuccin Frappé",
            .catppuccinMacchiato: "Catppuccin Macchiato",
            .dracula: "Dracula",
            .everforestDarkHard: "Everforest Dark Hard",
            .everforestDark: "Everforest Dark",
            .everforestDarkSoft: "Everforest Dark Soft",
            .everforestLightHard: "Everforest Light Hard",
            .everforestLight: "Everforest Light",
            .everforestLightSoft: "Everforest Light Soft",
            .githubDark: "GitHub Dark",
            .githubLight: "GitHub Light",
            .bulmaLight: "Bulma Light",
            .bulmaDark: "Bulma Dark",
            .gruvboxDarkHard: "Gruvbox Dark Hard",
            .gruvboxDark: "Gruvbox Dark",
            .gruvboxDarkSoft: "Gruvbox Dark Soft",
            .gruvboxLightHard: "Gruvbox Light Hard",
            .gruvboxLight: "Gruvbox Light",
            .gruvboxLightSoft: "Gruvbox Light Soft",
            .nord: "Nord",
            .solarizedDark: "Solarized Dark",
            .solarizedLight: "Solarized Light",
            .rosePine: "Rosé Pine",
            .rosePineMoon: "Rosé Pine Moon",
            .rosePineDawn: "Rosé Pine Dawn",
            .oneDark: "One Dark",
            .oneLight: "One Light",
            .radixSlateDark: "Radix Colors Slate Dark",
            .radixSlateLight: "Radix Colors Slate Light",
            .radixMauveDark: "Radix Colors Mauve Dark",
            .radixMauveLight: "Radix Colors Mauve Light",
            .kanagawaWave: "Kanagawa Wave",
            .kanagawaDragon: "Kanagawa Dragon",
            .kanagawaLotus: "Kanagawa Lotus",
        ]

        for (themeId, expectedLabel) in expectedLabels {
            let theme = ThemeRegistry.theme(for: themeId)
            XCTAssertEqual(theme?.label, expectedLabel, "Label mismatch for \(themeId.rawValue)")
        }
    }

    // MARK: - Theme ID Raw Value Tests

    func testThemeIdRawValues() {
        XCTAssertEqual(ThemeId.catppuccinMocha.rawValue, "catppuccin-mocha")
        XCTAssertEqual(ThemeId.catppuccinLatte.rawValue, "catppuccin-latte")
        XCTAssertEqual(ThemeId.dracula.rawValue, "dracula")
        XCTAssertEqual(ThemeId.everforestDarkHard.rawValue, "everforest-dark-hard")
        XCTAssertEqual(ThemeId.everforestDark.rawValue, "everforest-dark")
        XCTAssertEqual(ThemeId.everforestDarkSoft.rawValue, "everforest-dark-soft")
        XCTAssertEqual(ThemeId.everforestLightHard.rawValue, "everforest-light-hard")
        XCTAssertEqual(ThemeId.everforestLight.rawValue, "everforest-light")
        XCTAssertEqual(ThemeId.everforestLightSoft.rawValue, "everforest-light-soft")
        XCTAssertEqual(ThemeId.githubDark.rawValue, "github-dark")
        XCTAssertEqual(ThemeId.githubLight.rawValue, "github-light")
        XCTAssertEqual(ThemeId.bulmaLight.rawValue, "bulma-light")
        XCTAssertEqual(ThemeId.bulmaDark.rawValue, "bulma-dark")
        XCTAssertEqual(ThemeId.gruvboxDarkHard.rawValue, "gruvbox-dark-hard")
        XCTAssertEqual(ThemeId.gruvboxDark.rawValue, "gruvbox-dark")
        XCTAssertEqual(ThemeId.gruvboxDarkSoft.rawValue, "gruvbox-dark-soft")
        XCTAssertEqual(ThemeId.gruvboxLightHard.rawValue, "gruvbox-light-hard")
        XCTAssertEqual(ThemeId.gruvboxLight.rawValue, "gruvbox-light")
        XCTAssertEqual(ThemeId.gruvboxLightSoft.rawValue, "gruvbox-light-soft")
        XCTAssertEqual(ThemeId.nord.rawValue, "nord")
        XCTAssertEqual(ThemeId.solarizedDark.rawValue, "solarized-dark")
        XCTAssertEqual(ThemeId.solarizedLight.rawValue, "solarized-light")
        XCTAssertEqual(ThemeId.rosePine.rawValue, "rose-pine")
        XCTAssertEqual(ThemeId.rosePineMoon.rawValue, "rose-pine-moon")
        XCTAssertEqual(ThemeId.rosePineDawn.rawValue, "rose-pine-dawn")
        XCTAssertEqual(ThemeId.oneDark.rawValue, "one-dark")
        XCTAssertEqual(ThemeId.oneLight.rawValue, "one-light")
        XCTAssertEqual(ThemeId.radixSlateDark.rawValue, "radix-slate-dark")
        XCTAssertEqual(ThemeId.radixSlateLight.rawValue, "radix-slate-light")
        XCTAssertEqual(ThemeId.radixMauveDark.rawValue, "radix-mauve-dark")
        XCTAssertEqual(ThemeId.radixMauveLight.rawValue, "radix-mauve-light")
        XCTAssertEqual(ThemeId.kanagawaWave.rawValue, "kanagawa-wave")
        XCTAssertEqual(ThemeId.kanagawaDragon.rawValue, "kanagawa-dragon")
        XCTAssertEqual(ThemeId.kanagawaLotus.rawValue, "kanagawa-lotus")
    }

    // MARK: - Default Palette Tests

    func testDefaultPaletteExists() {
        let palette = ThemeRegistry.defaultPalette
        XCTAssertNotNil(palette)
    }

    // MARK: - Palette Token Tests

    func testAllThemesHaveValidPalettes() {
        for theme in ThemeRegistry.allThemes {
            // Each theme should have all required palette tokens
            // We can't easily compare Colors, but we verify they exist
            let palette = theme.palette
            XCTAssertNotNil(palette.backgroundBase)
            XCTAssertNotNil(palette.backgroundSurface)
            XCTAssertNotNil(palette.heading)
            XCTAssertNotNil(palette.bodyPrimary)
            XCTAssertNotNil(palette.bodySecondary)
            XCTAssertNotNil(palette.brandPrimary)
            XCTAssertNotNil(palette.stateSuccess)
            XCTAssertNotNil(palette.stateDanger)
            XCTAssertNotNil(palette.stateWarning)
            XCTAssertNotNil(palette.stateInfo)
        }
    }
}
