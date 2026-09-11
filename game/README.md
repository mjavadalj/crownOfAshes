# Crown of Ashes — Flutter game runtime

This is the mobile runtime for the editor project. It loads the canonical content export from `assets/content/content.json` and keeps individual card logic out of the widgets.

## Run locally

If this folder does not yet contain platform folders on a new machine, run:

```bash
cd game
flutter create . --platforms android,windows
flutter pub get
flutter run
```

## Import content from the editor

1. Open the editor with `npm run dev` from the repository root.
2. Use **Export** to download the deterministic JSON export.
3. Replace `game/assets/content/content.json` with that exported file.
4. Put card images in `game/assets/cards/` and keep each card's `artwork` value as `assets/cards/filename.png`.
5. Run `flutter pub get` and `flutter run` again.

The editor and game share the versioned fields `schemaVersion` and `contentVersion`. The loader ignores extra editor-only fields, so richer authoring data can be added without breaking the mobile runtime.
