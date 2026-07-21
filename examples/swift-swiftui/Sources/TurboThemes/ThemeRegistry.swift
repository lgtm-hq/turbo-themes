import SwiftUI


// MARK: - Shared Everforest Palettes

/// Shared foreground colors for all Everforest dark variants (only backgrounds differ).
private let everforestDarkPalette = (
    heading: Color(hex: "#A7C080"),
    bodyPrimary: Color(hex: "#D3C6AA"),
    bodySecondary: Color(hex: "#9DA9A0"),
    brandPrimary: Color(hex: "#A7C080"),
    stateSuccess: Color(hex: "#A7C080"),
    stateDanger: Color(hex: "#E67E80"),
    stateWarning: Color(hex: "#DBBC7F"),
    stateInfo: Color(hex: "#7FBBB3")
)

/// Shared foreground colors for all Everforest light variants (only backgrounds differ).
private let everforestLightPalette = (
    heading: Color(hex: "#6B7C01"),
    bodyPrimary: Color(hex: "#5C6A72"),
    bodySecondary: Color(hex: "#708089"),
    brandPrimary: Color(hex: "#6B7C01"),
    stateSuccess: Color(hex: "#6B7C01"),
    stateDanger: Color(hex: "#D03A38"),
    stateWarning: Color(hex: "#A87800"),
    stateInfo: Color(hex: "#2A7A9E")
)

// MARK: - Shared Gruvbox Palettes

/// Shared foreground colors for all Gruvbox dark variants (only backgrounds differ).
private let gruvboxDarkPalette = (
    heading: Color(hex: "#b8bb26"),
    bodyPrimary: Color(hex: "#ebdbb2"),
    bodySecondary: Color(hex: "#d5c4a1"),
    brandPrimary: Color(hex: "#d79921"),
    stateSuccess: Color(hex: "#b8bb26"),
    stateDanger: Color(hex: "#fb4934"),
    stateWarning: Color(hex: "#fabd2f"),
    stateInfo: Color(hex: "#83a598")
)

/// Shared foreground colors for all Gruvbox light variants (only backgrounds differ).
private let gruvboxLightPalette = (
    heading: Color(hex: "#79740e"),
    bodyPrimary: Color(hex: "#3c3836"),
    bodySecondary: Color(hex: "#504945"),
    brandPrimary: Color(hex: "#b57614"),
    stateSuccess: Color(hex: "#79740e"),
    stateDanger: Color(hex: "#9d0006"),
    stateWarning: Color(hex: "#b57614"),
    stateInfo: Color(hex: "#076678")
)

/// Registry of all available themes with their palettes.
public enum ThemeRegistry {
    /// Default palette used as fallback (Catppuccin Mocha).
    public static let defaultPalette = ThemePalette(
        backgroundBase: Color(hex: "#1e1e2e"),
        backgroundSurface: Color(hex: "#313244"),
        heading: Color(hex: "#f5e0dc"),
        bodyPrimary: Color(hex: "#cdd6f4"),
        bodySecondary: Color(hex: "#bac2de"),
        brandPrimary: Color(hex: "#cba6f7"),
        stateSuccess: Color(hex: "#a6e3a1"),
        stateDanger: Color(hex: "#f38ba8"),
        stateWarning: Color(hex: "#f9e2af"),
        stateInfo: Color(hex: "#89dceb")
    )

    /// All registered themes indexed by ThemeId.
    public static let themes: [ThemeId: ThemeDefinition] = [
        .catppuccinMocha: ThemeDefinition(
            id: .catppuccinMocha,
            label: "Catppuccin Mocha",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#1e1e2e"),
                backgroundSurface: Color(hex: "#313244"),
                heading: Color(hex: "#f5e0dc"),
                bodyPrimary: Color(hex: "#cdd6f4"),
                bodySecondary: Color(hex: "#bac2de"),
                brandPrimary: Color(hex: "#cba6f7"),
                stateSuccess: Color(hex: "#a6e3a1"),
                stateDanger: Color(hex: "#f38ba8"),
                stateWarning: Color(hex: "#f9e2af"),
                stateInfo: Color(hex: "#89dceb")
            )
        ),
        .catppuccinLatte: ThemeDefinition(
            id: .catppuccinLatte,
            label: "Catppuccin Latte",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#eff1f5"),
                backgroundSurface: Color(hex: "#e6e9ef"),
                heading: Color(hex: "#4c4f69"),
                bodyPrimary: Color(hex: "#5c5f77"),
                bodySecondary: Color(hex: "#6c6f85"),
                brandPrimary: Color(hex: "#8839ef"),
                stateSuccess: Color(hex: "#40a02b"),
                stateDanger: Color(hex: "#d20f39"),
                stateWarning: Color(hex: "#df8e1d"),
                stateInfo: Color(hex: "#209fb5")
            )
        ),
        .catppuccinFrappe: ThemeDefinition(
            id: .catppuccinFrappe,
            label: "Catppuccin Frappé",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#303446"),
                backgroundSurface: Color(hex: "#414559"),
                heading: Color(hex: "#f2d5cf"),
                bodyPrimary: Color(hex: "#c6d0f5"),
                bodySecondary: Color(hex: "#b5bfe2"),
                brandPrimary: Color(hex: "#ca9ee6"),
                stateSuccess: Color(hex: "#a6d189"),
                stateDanger: Color(hex: "#e78284"),
                stateWarning: Color(hex: "#e5c890"),
                stateInfo: Color(hex: "#99d1db")
            )
        ),
        .catppuccinMacchiato: ThemeDefinition(
            id: .catppuccinMacchiato,
            label: "Catppuccin Macchiato",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#24273a"),
                backgroundSurface: Color(hex: "#363a4f"),
                heading: Color(hex: "#f4dbd6"),
                bodyPrimary: Color(hex: "#cad3f5"),
                bodySecondary: Color(hex: "#b8c0e0"),
                brandPrimary: Color(hex: "#c6a0f6"),
                stateSuccess: Color(hex: "#a6da95"),
                stateDanger: Color(hex: "#ed8796"),
                stateWarning: Color(hex: "#eed49f"),
                stateInfo: Color(hex: "#91d7e3")
            )
        ),
        .dracula: ThemeDefinition(
            id: .dracula,
            label: "Dracula",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#282a36"),
                backgroundSurface: Color(hex: "#303347"),
                heading: Color(hex: "#f8f8f2"),
                bodyPrimary: Color(hex: "#f8f8f2"),
                bodySecondary: Color(hex: "#c5c8d4"),
                brandPrimary: Color(hex: "#bd93f9"),
                stateSuccess: Color(hex: "#50fa7b"),
                stateDanger: Color(hex: "#ff5555"),
                stateWarning: Color(hex: "#f1fa8c"),
                stateInfo: Color(hex: "#8be9fd")
            )
        ),
        .githubDark: ThemeDefinition(
            id: .githubDark,
            label: "GitHub Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#0d1117"),
                backgroundSurface: Color(hex: "#161b22"),
                heading: Color(hex: "#e6edf3"),
                bodyPrimary: Color(hex: "#c9d1d9"),
                bodySecondary: Color(hex: "#8b949e"),
                brandPrimary: Color(hex: "#2f81f7"),
                stateSuccess: Color(hex: "#3fb950"),
                stateDanger: Color(hex: "#f85149"),
                stateWarning: Color(hex: "#d29922"),
                stateInfo: Color(hex: "#2f81f7")
            )
        ),
        .githubLight: ThemeDefinition(
            id: .githubLight,
            label: "GitHub Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#ffffff"),
                backgroundSurface: Color(hex: "#f6f8fa"),
                heading: Color(hex: "#1f2328"),
                bodyPrimary: Color(hex: "#24292f"),
                bodySecondary: Color(hex: "#57606a"),
                brandPrimary: Color(hex: "#0969da"),
                stateSuccess: Color(hex: "#1f883d"),
                stateDanger: Color(hex: "#cf222e"),
                stateWarning: Color(hex: "#9a6700"),
                stateInfo: Color(hex: "#0969da")
            )
        ),
        .bulmaLight: ThemeDefinition(
            id: .bulmaLight,
            label: "Bulma Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#ffffff"),
                backgroundSurface: Color(hex: "#f5f5f5"),
                heading: Color(hex: "#242424"),
                bodyPrimary: Color(hex: "#363636"),
                bodySecondary: Color(hex: "#4a4a4a"),
                brandPrimary: Color(hex: "#00d1b2"),
                stateSuccess: Color(hex: "#22c55e"),
                stateDanger: Color(hex: "#ef4444"),
                stateWarning: Color(hex: "#f59e0b"),
                stateInfo: Color(hex: "#3b82f6")
            )
        ),
        .bulmaDark: ThemeDefinition(
            id: .bulmaDark,
            label: "Bulma Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#1a1a2e"),
                backgroundSurface: Color(hex: "#252540"),
                heading: Color(hex: "#f5f5f5"),
                bodyPrimary: Color(hex: "#e5e7eb"),
                bodySecondary: Color(hex: "#cbd5e1"),
                brandPrimary: Color(hex: "#00d1b2"),
                stateSuccess: Color(hex: "#22c55e"),
                stateDanger: Color(hex: "#ef4444"),
                stateWarning: Color(hex: "#f59e0b"),
                stateInfo: Color(hex: "#3b82f6")
            )
        ),

        .everforestDarkHard: ThemeDefinition(
            id: .everforestDarkHard,
            label: "Everforest Dark Hard",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#272E33"),
                backgroundSurface: Color(hex: "#2E383C"),
                heading: everforestDarkPalette.heading,
                bodyPrimary: everforestDarkPalette.bodyPrimary,
                bodySecondary: everforestDarkPalette.bodySecondary,
                brandPrimary: everforestDarkPalette.brandPrimary,
                stateSuccess: everforestDarkPalette.stateSuccess,
                stateDanger: everforestDarkPalette.stateDanger,
                stateWarning: everforestDarkPalette.stateWarning,
                stateInfo: everforestDarkPalette.stateInfo
            )
        ),
        .everforestDark: ThemeDefinition(
            id: .everforestDark,
            label: "Everforest Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#2D353B"),
                backgroundSurface: Color(hex: "#343F44"),
                heading: everforestDarkPalette.heading,
                bodyPrimary: everforestDarkPalette.bodyPrimary,
                bodySecondary: everforestDarkPalette.bodySecondary,
                brandPrimary: everforestDarkPalette.brandPrimary,
                stateSuccess: everforestDarkPalette.stateSuccess,
                stateDanger: everforestDarkPalette.stateDanger,
                stateWarning: everforestDarkPalette.stateWarning,
                stateInfo: everforestDarkPalette.stateInfo
            )
        ),
        .everforestDarkSoft: ThemeDefinition(
            id: .everforestDarkSoft,
            label: "Everforest Dark Soft",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#333C43"),
                backgroundSurface: Color(hex: "#3A464C"),
                heading: everforestDarkPalette.heading,
                bodyPrimary: everforestDarkPalette.bodyPrimary,
                bodySecondary: everforestDarkPalette.bodySecondary,
                brandPrimary: everforestDarkPalette.brandPrimary,
                stateSuccess: everforestDarkPalette.stateSuccess,
                stateDanger: everforestDarkPalette.stateDanger,
                stateWarning: everforestDarkPalette.stateWarning,
                stateInfo: everforestDarkPalette.stateInfo
            )
        ),
        .everforestLightHard: ThemeDefinition(
            id: .everforestLightHard,
            label: "Everforest Light Hard",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#FFFBEF"),
                backgroundSurface: Color(hex: "#F8F5E4"),
                heading: everforestLightPalette.heading,
                bodyPrimary: everforestLightPalette.bodyPrimary,
                bodySecondary: everforestLightPalette.bodySecondary,
                brandPrimary: everforestLightPalette.brandPrimary,
                stateSuccess: everforestLightPalette.stateSuccess,
                stateDanger: everforestLightPalette.stateDanger,
                stateWarning: everforestLightPalette.stateWarning,
                stateInfo: everforestLightPalette.stateInfo
            )
        ),
        .everforestLight: ThemeDefinition(
            id: .everforestLight,
            label: "Everforest Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#FDF6E3"),
                backgroundSurface: Color(hex: "#F4F0D9"),
                heading: everforestLightPalette.heading,
                bodyPrimary: everforestLightPalette.bodyPrimary,
                bodySecondary: everforestLightPalette.bodySecondary,
                brandPrimary: everforestLightPalette.brandPrimary,
                stateSuccess: everforestLightPalette.stateSuccess,
                stateDanger: everforestLightPalette.stateDanger,
                stateWarning: everforestLightPalette.stateWarning,
                stateInfo: everforestLightPalette.stateInfo
            )
        ),
        .everforestLightSoft: ThemeDefinition(
            id: .everforestLightSoft,
            label: "Everforest Light Soft",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#F3EAD3"),
                backgroundSurface: Color(hex: "#EAE4CA"),
                heading: everforestLightPalette.heading,
                bodyPrimary: everforestLightPalette.bodyPrimary,
                bodySecondary: everforestLightPalette.bodySecondary,
                brandPrimary: everforestLightPalette.brandPrimary,
                stateSuccess: everforestLightPalette.stateSuccess,
                stateDanger: everforestLightPalette.stateDanger,
                stateWarning: everforestLightPalette.stateWarning,
                stateInfo: everforestLightPalette.stateInfo
            )
        ),
        .gruvboxDarkHard: ThemeDefinition(
            id: .gruvboxDarkHard,
            label: "Gruvbox Dark Hard",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#1d2021"),
                backgroundSurface: Color(hex: "#282828"),
                heading: gruvboxDarkPalette.heading,
                bodyPrimary: gruvboxDarkPalette.bodyPrimary,
                bodySecondary: gruvboxDarkPalette.bodySecondary,
                brandPrimary: gruvboxDarkPalette.brandPrimary,
                stateSuccess: gruvboxDarkPalette.stateSuccess,
                stateDanger: gruvboxDarkPalette.stateDanger,
                stateWarning: gruvboxDarkPalette.stateWarning,
                stateInfo: gruvboxDarkPalette.stateInfo
            )
        ),
        .gruvboxDark: ThemeDefinition(
            id: .gruvboxDark,
            label: "Gruvbox Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#282828"),
                backgroundSurface: Color(hex: "#3c3836"),
                heading: gruvboxDarkPalette.heading,
                bodyPrimary: gruvboxDarkPalette.bodyPrimary,
                bodySecondary: gruvboxDarkPalette.bodySecondary,
                brandPrimary: gruvboxDarkPalette.brandPrimary,
                stateSuccess: gruvboxDarkPalette.stateSuccess,
                stateDanger: gruvboxDarkPalette.stateDanger,
                stateWarning: gruvboxDarkPalette.stateWarning,
                stateInfo: gruvboxDarkPalette.stateInfo
            )
        ),
        .gruvboxDarkSoft: ThemeDefinition(
            id: .gruvboxDarkSoft,
            label: "Gruvbox Dark Soft",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#32302f"),
                backgroundSurface: Color(hex: "#3c3836"),
                heading: gruvboxDarkPalette.heading,
                bodyPrimary: gruvboxDarkPalette.bodyPrimary,
                bodySecondary: gruvboxDarkPalette.bodySecondary,
                brandPrimary: gruvboxDarkPalette.brandPrimary,
                stateSuccess: gruvboxDarkPalette.stateSuccess,
                stateDanger: gruvboxDarkPalette.stateDanger,
                stateWarning: gruvboxDarkPalette.stateWarning,
                stateInfo: gruvboxDarkPalette.stateInfo
            )
        ),
        .gruvboxLightHard: ThemeDefinition(
            id: .gruvboxLightHard,
            label: "Gruvbox Light Hard",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#f9f5d7"),
                backgroundSurface: Color(hex: "#fbf1c7"),
                heading: gruvboxLightPalette.heading,
                bodyPrimary: gruvboxLightPalette.bodyPrimary,
                bodySecondary: gruvboxLightPalette.bodySecondary,
                brandPrimary: gruvboxLightPalette.brandPrimary,
                stateSuccess: gruvboxLightPalette.stateSuccess,
                stateDanger: gruvboxLightPalette.stateDanger,
                stateWarning: gruvboxLightPalette.stateWarning,
                stateInfo: gruvboxLightPalette.stateInfo
            )
        ),
        .gruvboxLight: ThemeDefinition(
            id: .gruvboxLight,
            label: "Gruvbox Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#fbf1c7"),
                backgroundSurface: Color(hex: "#ebdbb2"),
                heading: gruvboxLightPalette.heading,
                bodyPrimary: gruvboxLightPalette.bodyPrimary,
                bodySecondary: gruvboxLightPalette.bodySecondary,
                brandPrimary: gruvboxLightPalette.brandPrimary,
                stateSuccess: gruvboxLightPalette.stateSuccess,
                stateDanger: gruvboxLightPalette.stateDanger,
                stateWarning: gruvboxLightPalette.stateWarning,
                stateInfo: gruvboxLightPalette.stateInfo
            )
        ),
        .gruvboxLightSoft: ThemeDefinition(
            id: .gruvboxLightSoft,
            label: "Gruvbox Light Soft",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#f2e5bc"),
                backgroundSurface: Color(hex: "#ebdbb2"),
                heading: gruvboxLightPalette.heading,
                bodyPrimary: gruvboxLightPalette.bodyPrimary,
                bodySecondary: gruvboxLightPalette.bodySecondary,
                brandPrimary: gruvboxLightPalette.brandPrimary,
                stateSuccess: gruvboxLightPalette.stateSuccess,
                stateDanger: gruvboxLightPalette.stateDanger,
                stateWarning: gruvboxLightPalette.stateWarning,
                stateInfo: gruvboxLightPalette.stateInfo
            )
        ),
        .nord: ThemeDefinition(
            id: .nord,
            label: "Nord",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#2e3440"),
                backgroundSurface: Color(hex: "#3b4252"),
                heading: Color(hex: "#88c0d0"),
                bodyPrimary: Color(hex: "#eceff4"),
                bodySecondary: Color(hex: "#d8dee9"),
                brandPrimary: Color(hex: "#88c0d0"),
                stateSuccess: Color(hex: "#a3be8c"),
                stateDanger: Color(hex: "#bf616a"),
                stateWarning: Color(hex: "#ebcb8b"),
                stateInfo: Color(hex: "#81a1c1")
            )
        ),
        .solarizedDark: ThemeDefinition(
            id: .solarizedDark,
            label: "Solarized Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#002b36"),
                backgroundSurface: Color(hex: "#073642"),
                heading: Color(hex: "#268bd2"),
                bodyPrimary: Color(hex: "#839496"),
                bodySecondary: Color(hex: "#657b83"),
                brandPrimary: Color(hex: "#268bd2"),
                stateSuccess: Color(hex: "#859900"),
                stateDanger: Color(hex: "#dc322f"),
                stateWarning: Color(hex: "#b58900"),
                stateInfo: Color(hex: "#2aa198")
            )
        ),
        .solarizedLight: ThemeDefinition(
            id: .solarizedLight,
            label: "Solarized Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#fdf6e3"),
                backgroundSurface: Color(hex: "#eee8d5"),
                heading: Color(hex: "#268bd2"),
                bodyPrimary: Color(hex: "#657b83"),
                bodySecondary: Color(hex: "#839496"),
                brandPrimary: Color(hex: "#268bd2"),
                stateSuccess: Color(hex: "#859900"),
                stateDanger: Color(hex: "#dc322f"),
                stateWarning: Color(hex: "#b58900"),
                stateInfo: Color(hex: "#2aa198")
            )
        ),
        .rosePine: ThemeDefinition(
            id: .rosePine,
            label: "Rosé Pine",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#191724"),
                backgroundSurface: Color(hex: "#1f1d2e"),
                heading: Color(hex: "#e0def4"),
                bodyPrimary: Color(hex: "#e0def4"),
                bodySecondary: Color(hex: "#908caa"),
                brandPrimary: Color(hex: "#c4a7e7"),
                stateSuccess: Color(hex: "#31748f"),
                stateDanger: Color(hex: "#eb6f92"),
                stateWarning: Color(hex: "#f6c177"),
                stateInfo: Color(hex: "#9ccfd8")
            )
        ),
        .rosePineMoon: ThemeDefinition(
            id: .rosePineMoon,
            label: "Rosé Pine Moon",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#232136"),
                backgroundSurface: Color(hex: "#2a273f"),
                heading: Color(hex: "#e0def4"),
                bodyPrimary: Color(hex: "#e0def4"),
                bodySecondary: Color(hex: "#908caa"),
                brandPrimary: Color(hex: "#c4a7e7"),
                stateSuccess: Color(hex: "#3e8fb0"),
                stateDanger: Color(hex: "#eb6f92"),
                stateWarning: Color(hex: "#f6c177"),
                stateInfo: Color(hex: "#9ccfd8")
            )
        ),
        .rosePineDawn: ThemeDefinition(
            id: .rosePineDawn,
            label: "Rosé Pine Dawn",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#faf4ed"),
                backgroundSurface: Color(hex: "#fffaf3"),
                heading: Color(hex: "#575279"),
                bodyPrimary: Color(hex: "#575279"),
                bodySecondary: Color(hex: "#797593"),
                brandPrimary: Color(hex: "#907aa9"),
                stateSuccess: Color(hex: "#56949f"),
                stateDanger: Color(hex: "#b4637a"),
                stateWarning: Color(hex: "#ea9d34"),
                stateInfo: Color(hex: "#d7827e")
            )
        ),
        .oneDark: ThemeDefinition(
            id: .oneDark,
            label: "One Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#282c34"),
                backgroundSurface: Color(hex: "#2c313a"),
                heading: Color(hex: "#61afef"),
                bodyPrimary: Color(hex: "#abb2bf"),
                bodySecondary: Color(hex: "#828997"),
                brandPrimary: Color(hex: "#61afef"),
                stateSuccess: Color(hex: "#98c379"),
                stateDanger: Color(hex: "#e06c75"),
                stateWarning: Color(hex: "#e5c07b"),
                stateInfo: Color(hex: "#56b6c2")
            )
        ),
        .oneLight: ThemeDefinition(
            id: .oneLight,
            label: "One Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#fafafa"),
                backgroundSurface: Color(hex: "#f0f0f0"),
                heading: Color(hex: "#4078f2"),
                bodyPrimary: Color(hex: "#383a42"),
                bodySecondary: Color(hex: "#696c77"),
                brandPrimary: Color(hex: "#4078f2"),
                stateSuccess: Color(hex: "#50a14f"),
                stateDanger: Color(hex: "#e45649"),
                stateWarning: Color(hex: "#c18401"),
                stateInfo: Color(hex: "#0184bc")
            )
        ),

        .radixSlateDark: ThemeDefinition(
            id: .radixSlateDark,
            label: "Radix Colors Slate Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#111113"),
                backgroundSurface: Color(hex: "#18191b"),
                heading: Color(hex: "#3dd68c"),
                bodyPrimary: Color(hex: "#edeef0"),
                bodySecondary: Color(hex: "#b0b4ba"),
                brandPrimary: Color(hex: "#0090ff"),
                stateSuccess: Color(hex: "#30a46c"),
                stateDanger: Color(hex: "#e5484d"),
                stateWarning: Color(hex: "#ffc53d"),
                stateInfo: Color(hex: "#00a2c7")
            )
        ),
        .radixSlateLight: ThemeDefinition(
            id: .radixSlateLight,
            label: "Radix Colors Slate Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#fcfcfd"),
                backgroundSurface: Color(hex: "#f9f9fb"),
                heading: Color(hex: "#218358"),
                bodyPrimary: Color(hex: "#1c2024"),
                bodySecondary: Color(hex: "#60646c"),
                brandPrimary: Color(hex: "#0090ff"),
                stateSuccess: Color(hex: "#30a46c"),
                stateDanger: Color(hex: "#e5484d"),
                stateWarning: Color(hex: "#ffc53d"),
                stateInfo: Color(hex: "#00a2c7")
            )
        ),
        .radixMauveDark: ThemeDefinition(
            id: .radixMauveDark,
            label: "Radix Colors Mauve Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#121113"),
                backgroundSurface: Color(hex: "#1a191b"),
                heading: Color(hex: "#3dd68c"),
                bodyPrimary: Color(hex: "#eeeef0"),
                bodySecondary: Color(hex: "#b5b2bc"),
                brandPrimary: Color(hex: "#0090ff"),
                stateSuccess: Color(hex: "#30a46c"),
                stateDanger: Color(hex: "#e5484d"),
                stateWarning: Color(hex: "#ffc53d"),
                stateInfo: Color(hex: "#00a2c7")
            )
        ),
        .radixMauveLight: ThemeDefinition(
            id: .radixMauveLight,
            label: "Radix Colors Mauve Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#fdfcfd"),
                backgroundSurface: Color(hex: "#faf9fb"),
                heading: Color(hex: "#218358"),
                bodyPrimary: Color(hex: "#211f26"),
                bodySecondary: Color(hex: "#65636d"),
                brandPrimary: Color(hex: "#0090ff"),
                stateSuccess: Color(hex: "#30a46c"),
                stateDanger: Color(hex: "#e5484d"),
                stateWarning: Color(hex: "#ffc53d"),
                stateInfo: Color(hex: "#00a2c7")
            )
        ),

        .kanagawaWave: ThemeDefinition(
            id: .kanagawaWave,
            label: "Kanagawa Wave",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#1F1F28"),
                backgroundSurface: Color(hex: "#2A2A37"),
                heading: Color(hex: "#7E9CD8"),
                bodyPrimary: Color(hex: "#DCD7BA"),
                bodySecondary: Color(hex: "#C8C093"),
                brandPrimary: Color(hex: "#7E9CD8"),
                stateSuccess: Color(hex: "#98BB6C"),
                stateDanger: Color(hex: "#E82424"),
                stateWarning: Color(hex: "#FF9E3B"),
                stateInfo: Color(hex: "#658594")
            )
        ),
        .kanagawaDragon: ThemeDefinition(
            id: .kanagawaDragon,
            label: "Kanagawa Dragon",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#181616"),
                backgroundSurface: Color(hex: "#282727"),
                heading: Color(hex: "#8ba4b0"),
                bodyPrimary: Color(hex: "#c5c9c5"),
                bodySecondary: Color(hex: "#C8C093"),
                brandPrimary: Color(hex: "#8ba4b0"),
                stateSuccess: Color(hex: "#98BB6C"),
                stateDanger: Color(hex: "#E82424"),
                stateWarning: Color(hex: "#FF9E3B"),
                stateInfo: Color(hex: "#658594")
            )
        ),
        .kanagawaLotus: ThemeDefinition(
            id: .kanagawaLotus,
            label: "Kanagawa Lotus",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#f2ecbc"),
                backgroundSurface: Color(hex: "#e7dba0"),
                heading: Color(hex: "#4d699b"),
                bodyPrimary: Color(hex: "#545464"),
                bodySecondary: Color(hex: "#43436c"),
                brandPrimary: Color(hex: "#4d699b"),
                stateSuccess: Color(hex: "#6f894e"),
                stateDanger: Color(hex: "#e82424"),
                stateWarning: Color(hex: "#e98a00"),
                stateInfo: Color(hex: "#5a7785")
            )
        ),
        .ayuDark: ThemeDefinition(
            id: .ayuDark,
            label: "Ayu Dark",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#0d1017"),
                backgroundSurface: Color(hex: "#141821"),
                heading: Color(hex: "#ffb454"),
                bodyPrimary: Color(hex: "#bfbdb6"),
                bodySecondary: Color(hex: "#5b6876"),
                brandPrimary: Color(hex: "#e6b450"),
                stateSuccess: Color(hex: "#aad94c"),
                stateDanger: Color(hex: "#d95757"),
                stateWarning: Color(hex: "#ff8f40"),
                stateInfo: Color(hex: "#39bae6")
            )
        ),
        .ayuMirage: ThemeDefinition(
            id: .ayuMirage,
            label: "Ayu Mirage",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#1f2430"),
                backgroundSurface: Color(hex: "#282e3b"),
                heading: Color(hex: "#ffd173"),
                bodyPrimary: Color(hex: "#cccac2"),
                bodySecondary: Color(hex: "#707a8c"),
                brandPrimary: Color(hex: "#ffcc66"),
                stateSuccess: Color(hex: "#d5ff80"),
                stateDanger: Color(hex: "#ff6666"),
                stateWarning: Color(hex: "#ffad66"),
                stateInfo: Color(hex: "#5ccfe6")
            )
        ),
        .ayuLight: ThemeDefinition(
            id: .ayuLight,
            label: "Ayu Light",
            palette: ThemePalette(
                backgroundBase: Color(hex: "#f8f9fa"),
                backgroundSurface: Color(hex: "#fafafa"),
                heading: Color(hex: "#f2a300"),
                bodyPrimary: Color(hex: "#5c6166"),
                bodySecondary: Color(hex: "#828e9f"),
                brandPrimary: Color(hex: "#f29718"),
                stateSuccess: Color(hex: "#86b300"),
                stateDanger: Color(hex: "#e65050"),
                stateWarning: Color(hex: "#ff7e33"),
                stateInfo: Color(hex: "#55b4d4")
            )
        ),
    ]

    /// Get a theme by its ID.
    ///
    /// - Parameter id: The theme identifier.
    /// - Returns: The theme definition, or nil if not found.
    public static func theme(for id: ThemeId) -> ThemeDefinition? {
        themes[id]
    }

    /// Get all available theme IDs.
    public static var allThemeIds: [ThemeId] {
        ThemeId.allCases
    }

    /// Get all registered themes.
    public static var allThemes: [ThemeDefinition] {
        ThemeId.allCases.compactMap { themes[$0] }
    }
}
