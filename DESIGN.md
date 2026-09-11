# Crown of Ashes — card art direction

The user's September 11, 2026 reference image is the visual authority for player-facing cards: a cloaked figure before a monumental cathedral, weathered gold framing, warm narrative lettering, and two engraved decisions. This direction applies to future artwork, card frames, choices, and player-facing compositions.

## Palette and material

- Soot black `#080708`; card ground `#100D0E`.
- Warm parchment lettering `#E1C39C`; secondary lettering `#BCA58A`.
- Tarnished brass `#AB8456`, with darker engraved edges `#99764E`.
- Deep burgundy `#301315` for the first decision; charcoal `#121113` for the second. Colors distinguish the two decisions without implying good and evil.
- Metalwork uses fine doubled outlines, clipped corners, irregular highlights, corner engraving, and pointed central finials.

## Artwork

Painterly gothic scenes with broken brushwork, ash-filled light, deep architectural shadows, burgundy cloth, and monumental religious or political silhouettes. Figures should feel small against oppressive institutions. Keep bright areas concentrated around the subject; avoid polished, glossy fantasy rendering.

`game/assets/cards/temp.png` is the existing cathedral illustration and remains unchanged. Other authored image paths remain intact; missing artwork still requires a supplied illustration. Do not substitute the cathedral indiscriminately for unrelated narrative subjects.

## Composition and type

Artwork leads the upper portion of the framed artifact. Center the situation below it, followed by a fine ornamental divider and paired decisions. Use bundled EB Garamond for warm literary typography; its license ships in `game/assets/fonts/OFL.txt`. Keep the card title subordinate to the situation.

The Flutter card scrolls on short screens. Narrative and decision text remain complete; choices stack when the available width or text scaling requires it. Preserve swipe selection, keyboard-accessible buttons, disabled choices, and the existing effect system.

## Implementation

- `game/lib/reliquary_frame.dart`: reusable engraved frames and divider.
- `game/lib/main.dart`: player card layout, typography, artwork, and decision buttons.
- `src/App.tsx` and `src/styles.css`: live card appearance preview with authored text and simulation actions. The editor's surrounding authoring workspace retains its operational layout.

The runtime uses drawn ornamental metalwork. The editor preview is a simpler CSS rendition of the same palette, type, framing, and composition. Neither is a pixel-identical reproduction of the reference's painted surface texture.

## Verification handoff

The user will test the implementation. Automated Flutter verification was not completed: SDK/cache access was unavailable, and the existing package configuration references unavailable dependencies. No gameplay test pass is claimed.
