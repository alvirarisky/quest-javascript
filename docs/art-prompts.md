# Original game art

Tool: built-in imagegen, not CLI. All requested assets are copied into this repository.

- `public/assets/facility.png`: Panoramic original 2D side-view abandoned research facility control room. Detailed CRT monitor bank, windows into a dark corridor, steel exit door, cables, pipes, desks and papers. Charcoal, desaturated steel, teal shadows and restrained emergency red; cinematic hand-painted realistic horror. No characters, UI, logos or lettering.
- `public/assets/rooms-atlas.png`: Four horizontal side-view research facility strips: power station with turbine and pipes; security cage passage and shutter gate; experiment lab with observation glass and tanks; robot maintenance workshop and crane. Consistent detailed illustrated horror palette. Regions are used as separate room textures without changing their proportions.
- `public/assets/operator.png`: Six-cell 3-by-2 operator sprite sheet, 1536×1024. The same tired IT operator in blue-gray work uniform, ID card, flashlight, belt and boots. Idle, two walking strides, terminal interaction, surprised look back, and escape. Detailed original illustration with cyan rim lighting.
- Operator edit prompt: Preserve all six poses, positions and proportions; remove dark background and surrounding glows to a genuine transparent alpha cutout.

No copyrighted game characters or third-party game artwork are used.


- `public/assets/watcher-scare-v2.png`: Original close-range horror creature pressed against industrial observation glass, gaunt charcoal face, deep eyes, hand against the window, restrained warm corridor lighting, cinematic realistic texture. No gore, text, logos or copyrighted game characters. Generated through built-in imagegen and copied locally; cropped to fill the viewport during the impact.
- `public/audio/null07-impact.wav`: Original procedural metallic slam, distorted breath and scrape; generated with Python standard-library synthesis, without third-party recordings.

## Selectable protagonists

- User-supplied photographs are likeness references for the sprites. The selector shows industrial personnel ID cards using the first sprite frame; original photographs are not bundled as public assets.
- `female-sprite.png`: six 512×512 poses in a 1536×1024 transparent sheet, derived from the supplied female photo. Long black hair, black glasses, burgundy outerwear, heart pendant, trousers, boots and flashlight. Existing operator sheet used only as the pose/style reference.
- `male-sprite.png`: same six-frame layout, derived from the supplied male photo. Tousled black hair, charcoal olive jacket, black shirt, chain necklace, watch, trousers, boots and flashlight.
- Both sheets were generated with the built-in imagegen tool and copied into the workspace. Pose order: idle, two walking strides, terminal interaction, startled, escape. The original uploaded portraits remain reference inputs only.

- `public/audio/null07-{step,door,machine,radio,knock,pipe,steam,robot,scan,whisper}.wav`: ten original deterministic mono PCM facility effects, generated with Python standard-library synthesis by `scripts/generate-effects.py`. No external recordings or copyrighted audio. Distant cues are panned in Web Audio; the radio is a static/tuning effect with readable subtitles, not recorded spoken dialogue.
