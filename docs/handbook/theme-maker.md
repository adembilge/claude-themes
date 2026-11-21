# Theme Maker

Create a palette from a name, a light or dark base, and an accent color. Then use **Appearance** to tune it and choose when Claude-Themes applies it.

## Build a theme

1. Open `/claude-themes` and select **Theme Maker**.
2. Enter a name, choose **Dark** or **Light**, and enter an accent. For example, use `#d98a4e`, `rgb(217, 138, 78)`, `hsl(26, 65%, 56%)`, or `coral`.
3. Review the preview for text, surfaces, accent, and status colors. The preview reports adjustments made by the palette’s contrast checks.
4. Save the theme to apply it and add it to your custom themes.

[Watch the Theme Maker demo](../media/theme-maker.gif).

## Tune appearance

Open **Appearance** while the theme you want to adjust is active. Its seven tuning controls cover warmth, saturation, surface brightness, text contrast, surface tint, accent, and status colors. The available stops depend on the palette’s contrast checks.

| Setting | When to use it |
| --- | --- |
| **Backdrop** | Add a soft background behind the chat. Choose Glow, Sunrise, Spotlight, Duotone, Vignette, Dusk, Twilight, Ember, or Halo at Subtle, Normal, or Bold strength. |
| **High contrast** | Make borders and focus rings easier to distinguish. |
| **Palette-matched code colors** | Bring syntax colors into the current palette. |
| **Soften glare** | Reduce the glare of a bright light palette. |
| **Night comfort** | Add a warmer look. Enable its night-only option to use the hours configured under **Day and night**. |

Export or share the active theme after tuning. See [what each format carries](import-export.md#export-a-palette).

## Set day, night, and folder themes

### Choose a schedule

In **Appearance**, open **Day and night**, select **By the hour**, choose a day theme and a night theme, and set the hours. The plugin checks the period when a session starts and when you submit a prompt. If the clock crosses a boundary during an idle session, the next prompt can trigger the switch.

### Follow system mode

**Follow system** uses the configured day palette in light mode and the night palette in dark mode. It disables the clock-based schedule. Choose **By the hour** to use the configured hours again. Picking a theme manually turns off **Follow system**.

### Keep a theme for a folder

Open the folder in a local Code session, apply the palette, then use the folder theme card in **Settings** to save it for that folder. A saved folder theme takes precedence over the default and the schedule in new sessions. **Follow system** takes precedence when enabled. Use the same card to clear the folder choice.
