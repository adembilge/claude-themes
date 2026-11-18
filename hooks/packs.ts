import type { Mode, Roles, Surfaces, Text3, Theme } from './model.js'

// More built-in themes, kept apart from the main list. Every palette is taken from the project's own
// source (linked on each entry) and the hex values below are final. Where an official color would fail the
// text-contrast rule or the surface order, only the muted text or the lightest surface was moved, and the
// entry says so under "shifted". "derived" means the palette has no color for that slot, so it was mixed
// from its neighbours. Surfaces run page -> card -> panel -> menu; light ones end on two equal colors.

function pack(
  family: string,
  mode: Mode,
  id: string,
  name: string,
  note: string,
  surfaces: Surfaces,
  text: Text3,
  accent: string,
  [danger, success, warning, pro]: [string, string, string, string],
): Theme {
  const roles: Roles = { danger, success, warning, pro }

  return { id, name, note, mode, surfaces, text, accent, roles, family }
}

export const PACKS: Theme[] = [
  // https://github.com/rose-pine/rose-pine-palette/blob/main/palette.json
  // shifted: surface 4 derived; second text derived; muted text #908caa -> #928eac
  pack('Rosé Pine', 'dark', 'rose-pine-moon', 'Rosé Pine Moon', 'muted rose and gold, deeper dusk',
    ['#232136', '#2a273f', '#393552', '#45415c'], ['#e0def4', '#b8b5cf', '#928eac'], '#ea9a97',
    ['#eb6f92', '#9ccfd8', '#f6c177', '#c4a7e7']),
  // https://github.com/EdenEast/nightfox.nvim/blob/main/lua/nightfox/palette/nightfox.lua
  // shifted: muted text #71839b -> #74859d
  pack('Nightfox', 'dark', 'nightfox', 'Nightfox', 'cool navy, soft blue',
    ['#131a24', '#192330', '#212e3f', '#29394f'], ['#cdcecf', '#aeafb0', '#74859d'], '#719cd6',
    ['#c94f6d', '#81b29a', '#dbc074', '#9d79d6']),
  // https://github.com/EdenEast/nightfox.nvim/blob/main/extra/carbonfox/base16.yaml
  // shifted: muted text #7b7c7e -> #7f8082
  pack('Nightfox', 'dark', 'carbonfox', 'Carbonfox', 'neutral carbon black, bright blue',
    ['#0c0c0c', '#161616', '#252525', '#353535'], ['#f2f4f8', '#b6b8bb', '#7f8082'], '#78a9ff',
    ['#ee5396', '#25be6a', '#08bdba', '#be95ff']),
  // https://github.com/rebelot/kanagawa.nvim/blob/master/lua/kanagawa/colors.lua
  pack('Kanagawa', 'dark', 'kanagawa-dragon', 'Kanagawa Dragon', 'ink black, ash and stone',
    ['#0d0c0c', '#181616', '#282727', '#393836'], ['#c5c9c5', '#a6a69c', '#9e9b93'], '#8ba4b0',
    ['#c4746e', '#87a987', '#ff9e3b', '#8992a7']),
  // https://github.com/drcmda/poimandres-theme/blob/main/src/theme.js
  // shifted: muted text #868cad -> #898faf
  pack('Poimandres', 'dark', 'poimandres', 'Poimandres', 'ink blue-black, mint',
    ['#1b1e28', '#252b37', '#303340', '#404350'], ['#e4f0fb', '#a6accd', '#898faf'], '#5de4c7',
    ['#d0679d', '#5fb3a1', '#fffac2', '#f087bd']),
  // https://github.com/wesbos/cobalt2-vscode/blob/master/theme/cobalt2.json
  // shifted: surface 4 derived; second text derived
  pack('Cobalt2', 'dark', 'cobalt2', 'Cobalt2', 'deep cobalt blue, gold',
    ['#15232d', '#193549', '#1f4662', '#2c516b'], ['#ffffff', '#d5d5d5', '#aaaaaa'], '#ffc600',
    ['#ff628c', '#3ad900', '#ff9d00', '#fb94ff']),
  // https://github.com/whizkydee/vscode-palenight-theme/blob/master/themes/palenight.json
  // shifted: second text derived; muted text #6c739a -> #8088a9
  pack('Material', 'dark', 'palenight', 'Palenight', 'dusky purple-blue, Material',
    ['#232635', '#292d3e', '#31364a', '#383d51'], ['#bfc7d5', '#969db8', '#8088a9'], '#c792ea',
    ['#ff5572', '#a9c77d', '#ffcb6b', '#82aaff']),
  // https://github.com/ayu-theme/ayu-colors (via shikijs tm-themes ayu-mirage.json)
  // shifted: surface 4 derived; second text derived; muted text #707a8c -> #7f8695
  pack('Ayu', 'dark', 'ayu-mirage', 'Ayu Mirage', 'dusky blue-grey with gold',
    ['#1f2430', '#242936', '#282e3b', '#353b47'], ['#cccac2', '#9ea2a7', '#7f8695'], '#ffcc66',
    ['#f28273', '#87d96c', '#f29e74', '#ddbbff']),
  // https://github.com/primer/github-vscode-theme (via shikijs tm-themes github-dark-dimmed.json)
  // shifted: muted text #768390 -> #7e8a97
  pack('GitHub', 'dark', 'github-dark-dimmed', 'GitHub Dark Dimmed', 'softer slate-blue GitHub',
    ['#1c2128', '#22272e', '#2d333b', '#373e47'], ['#cdd9e5', '#adbac7', '#7e8a97'], '#539bf5',
    ['#f47067', '#57ab5a', '#c69026', '#b083f0']),
  // https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim (page: bg_dim of sainnhe/gruvbox-material hard)
  pack('Gruvbox', 'dark', 'gruvbox-dark-hard', 'Gruvbox Dark Hard', 'retro warm, deeper contrast',
    ['#141617', '#1d2021', '#282828', '#3c3836'], ['#ebdbb2', '#d5c4a1', '#a89984'], '#fe8019',
    ['#fb4934', '#b8bb26', '#fabd2f', '#d3869b']),
  // https://github.com/sainnhe/everforest/blob/master/autoload/everforest.vim
  pack('Everforest', 'dark', 'everforest-hard', 'Everforest Hard', 'deeper forest greens',
    ['#1e2326', '#272e33', '#2e383c', '#374145'], ['#d3c6aa', '#9da9a0', '#859289'], '#a7c080',
    ['#e67e80', '#a7c080', '#dbbc7f', '#d699b6']),
  // https://github.com/raunofreiberg/vesper (via shikijs tm-themes vesper.json)
  pack('Vesper', 'dark', 'vesper', 'Vesper', 'near-black, peach and mint',
    ['#101010', '#161616', '#1c1c1c', '#232323'], ['#ffffff', '#a0a0a0', '#7e7e7e'], '#ffc799',
    ['#ff8080', '#99ffe4', '#ff7300', '#ffcfa8']),
  // https://github.com/withastro/houston-vscode (via shikijs tm-themes houston.json)
  pack('Houston', 'dark', 'houston', 'Houston', 'space-black grey, mint',
    ['#17191e', '#23262d', '#2a2d34', '#343841'], ['#eef0f9', '#bfc1c9', '#858b98'], '#4bf3c8',
    ['#f4587e', '#23d18b', '#ffc368', '#cc75f4']),
  // ---- light ----
  // https://github.com/EdenEast/nightfox.nvim/blob/main/lua/nightfox/palette/dawnfox.lua
  // shifted: muted text #a8a3b3 -> #817c98
  pack('Nightfox', 'light', 'dawnfox', 'Dawnfox', 'warm rose paper, soft ink',
    ['#ebe0df', '#ebe5df', '#faf4ed', '#faf4ed'], ['#575279', '#625c87', '#817c98'], '#286983',
    ['#b4637a', '#618774', '#ea9d34', '#907aa9']),
  // https://github.com/EdenEast/nightfox.nvim/blob/main/lua/nightfox/palette/dayfox.lua
  pack('Nightfox', 'light', 'dayfox', 'Dayfox', 'warm stone, deep plum ink',
    ['#d3c7bb', '#e4dcd4', '#f6f2ee', '#f6f2ee'], ['#3d2b5a', '#643f61', '#824d5b'], '#2848a9',
    ['#a5222f', '#396847', '#ac5402', '#6e33ce']),
  // https://github.com/rebelot/kanagawa.nvim/blob/master/lua/kanagawa/colors.lua
  pack('Kanagawa', 'light', 'kanagawa-lotus', 'Kanagawa Lotus', 'pale parchment, indigo ink',
    ['#d5cea3', '#e5ddb0', '#f2ecbc', '#f2ecbc'], ['#43436c', '#545464', '#716e61'], '#4d699b',
    ['#c84053', '#6f894e', '#cc6d00', '#624c83']),
  // https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim
  pack('Gruvbox', 'light', 'gruvbox-light-hard', 'Gruvbox Light Hard', 'retro warm, bright paper',
    ['#ebdbb2', '#f2e5bc', '#f9f5d7', '#f9f5d7'], ['#3c3836', '#504945', '#7c6f64'], '#d65d0e',
    ['#cc241d', '#79740e', '#d79921', '#b16286']),
  // https://github.com/sainnhe/everforest/blob/master/autoload/everforest.vim
  // shifted: muted text #829181 -> #7d8c81
  pack('Everforest', 'light', 'everforest-light-hard', 'Everforest Light Hard', 'bright cream and moss',
    ['#f2efdf', '#f8f5e4', '#fffbef', '#fffbef'], ['#5c6a72', '#708089', '#7d8c81'], '#8da101',
    ['#f85552', '#8da101', '#dfa000', '#df69ba']),
  // https://github.com/mhartington/oceanic-next/blob/master/colors/OceanicNextLight.vim
  pack('Oceanic Next', 'light', 'oceanic-next-light', 'Oceanic Next Light', 'cool white, slate ink',
    ['#d4d8dc', '#f5f7fa', '#ffffff', '#ffffff'], ['#343d46', '#4f5b66', '#65737e'], '#5a87b4',
    ['#d0545b', '#87af82', '#dcb057', '#ad82ad']),
  // https://github.com/uloco/theme-bluloco-light/blob/master/themes/bluloco-light-color-theme.json
  pack('Bluloco', 'light', 'bluloco-light', 'Bluloco Light', 'clean light grey, vivid blue',
    ['#e8e8e8', '#f1f1f1', '#f9f9f9', '#f9f9f9'], ['#383a42', '#676a77', '#727378'], '#0098dd',
    ['#d52753', '#23974a', '#df631c', '#823ff1']),
  // https://github.com/sdras/night-owl-vscode-theme (via shikijs tm-themes night-owl-light.json)
  // shifted: second text derived
  pack('Night Owl', 'light', 'night-owl-light', 'Night Owl Light', 'pale grey, indigo ink',
    ['#e0e0e0', '#f0f0f0', '#fbfbfb', '#fbfbfb'], ['#403f53', '#555876', '#697098'], '#4876d6',
    ['#de3d3b', '#08916a', '#e0af02', '#994cc3']),
]

/** The code-highlighting theme to pair with a pack, by the name the app's highlighter knows (a wrong name is ignored). */
export const PACK_CODE_THEMES: Record<string, string> = {
  'rose-pine-moon': 'rose-pine-moon',
  'kanagawa-dragon': 'kanagawa-dragon',
  'kanagawa-lotus': 'kanagawa-lotus',
  poimandres: 'poimandres',
  palenight: 'material-theme-palenight',
  'ayu-mirage': 'ayu-mirage',
  'github-dark-dimmed': 'github-dark-dimmed',
  'gruvbox-dark-hard': 'gruvbox-dark-hard',
  'gruvbox-light-hard': 'gruvbox-light-hard',
  'everforest-hard': 'everforest-dark',
  'everforest-light-hard': 'everforest-light',
  'night-owl-light': 'night-owl-light',
  vesper: 'vesper',
  houston: 'houston',
}
