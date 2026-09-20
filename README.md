# N-TacVLA project site

Author: Yu Sun. Affiliations supplied by the author: 戴盟机器人公司、大湾区大学、哈尔滨工业大学深圳。

Public research project page with one recorded G1 multimodal replay sample. No paper, model metrics, success rates or author affiliation mapping are inferred. Update `app/page.tsx` for project copy, `app/Replay.tsx` for replay controls, and `app/globals.css` for styling.

Website: **https://clearlove-yu.github.io/N-TacVLA/**

Hosted by GitHub Pages from the public `clearlove-Yu/N-TacVLA` repository. Pushing `main` runs `.github/workflows/pages.yml`, builds static files and publishes them. Set the repository's Pages source to **GitHub Actions**. No hosting token is stored in this project.

## Develop and build

Requires Node >=22.13 and npm. This workstation's isolated Node installation is `/home/a/.local/share/humanoidarena/tools/node-v24.21.0-linux-x64/bin`.

```bash
export PATH="/home/a/.local/share/humanoidarena/tools/node-v24.21.0-linux-x64/bin:$PATH"
cd /home/a/work/HumanoidArena/web/n-tacvla
npm ci
npm run dev -- --host 127.0.0.1
# In another terminal:
npm run build:pages
```

`npm run build:pages` exports to `dist/pages/`, including the recorded sample. It derives the URL prefix from `GITHUB_REPOSITORY` (default `clearlove-Yu/N-TacVLA`). Deploy the contents of this directory, not its parent. For local development `npm run dev` serves at `/`; a production preview must mount `dist/pages/` at `/N-TacVLA/` to match its asset URLs.

The source and deployment are isolated from the robot project. The old Sites configuration in `.openai/hosting.json` is retained as historical deployment metadata. The GitHub Pages build uses static export and does not enable Sites hosting, authentication or Cloudflare Workers. No credentials belong in source or this document.

## Replay data

`public/sample/` contains MP4 viewing copies and `replay.json`, exported from `episode_20260916T090235_676Z_push_box`. The original recording is labeled failure and technically invalid; the website displays these labels. It is an inspection sample, not model evaluation evidence.

Videos use 15 Hz samples on the G1 receive-time clock, with each frame taken from the last original camera sample at or before that time. Stereo eyes are rotated individually without swapping sides. Tactile data retains every sample, its original relative timestamp, validity, force, direction and proximity count. Gaps over 100 ms are marked stale; missing/invalid values remain unavailable. Normal/shear raw values use the existing protocol's 0.01 N unit. Proximity is a raw count, not distance. The browser is a viewing tool, not hardware-synchronized metrology.

To prepare a replacement sample, export into a new empty directory, inspect its content and quality labels, then replace `public/sample/` and republish:

```bash
cd /home/a/work/HumanoidArena
source scripts/common/paths.sh
python3 -m humanoidarena.collection.g1_data_collection.export_web_replay \
  recording_data/g1_stereo_inspire_g2/EPISODE \
  outputs/NEW_STATIC_SAMPLE
```

Only exported files are published. The website does not connect to a robot or read new recordings automatically, and requires no workstation to stay online after successful hosting. The previous local viewer remains available for browsing all local archives.

The reference project's layout inspired the editorial direction; its text, assets and research results were not copied. The share card in `public/og.png` is a generated project graphic, not scientific evidence.
