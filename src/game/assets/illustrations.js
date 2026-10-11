const svg = (body, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="metal" x2="1" y2=".7"><stop stop-color="#526269"/><stop offset=".35" stop-color="#27383f"/><stop offset="1" stop-color="#0c181f"/></linearGradient><linearGradient id="glass" x2=".3" y2="1"><stop stop-color="#203e40"/><stop offset="1" stop-color="#061316"/></linearGradient></defs>${body}</svg>`;
export const illustrations = {
  terminal: svg(
    `<path d="M82 104L92 180H39L51 104" fill="url(#metal)" stroke="#516068"/><path d="M16 174H112L127 188H3Z" fill="#16242a" stroke="#40545b"/><path d="M17 7L113 4L119 109L12 112Z" fill="url(#metal)" stroke="#6a7675" stroke-width="2"/><path d="M26 20H103V80H27Z" fill="url(#glass)" stroke="#081115" stroke-width="5"/><path d="M20 99L112 97L122 121L7 124Z" fill="#34474d" stroke="#617071"/><path d="M26 103H103M23 110H106M33 99V114M44 99V114M55 99V114M66 99V114M77 99V114M88 99V114" stroke="#0b161d" stroke-width="3"/><path d="M102 120Q148 136 109 157Q96 176 131 180" stroke="#050d13" stroke-width="5" fill="none"/><path d="M20 12L29 9M110 16L115 18M47 132L54 139M67 172L73 163" stroke="#9da197" opacity=".35"/><g fill="#9caaa1"><circle cx="20" cy="17" r="2"/><circle cx="109" cy="13" r="2"/><circle cx="17" cy="100" r="2"/><circle cx="112" cy="99" r="2"/></g><path d="M33 28H97M33 36H97M33 44H97M33 52H97M33 60H97M33 68H97" stroke="#9fc8ac" opacity=".045"/>`,
    132,
    192,
  ),
  door: svg(
    `<path d="M7 3H128V330H7Z" fill="#09141b" stroke="#51636a" stroke-width="5"/><path d="M18 12H116V320H18Z" fill="url(#metal)" stroke="#607176"/><path d="M24 30H109V102H24Z" fill="#08171b" stroke="#374d54" stroke-width="4"/><path d="M28 36H105V96H28Z" fill="url(#glass)"/><path d="M44 30V101M87 30V101" stroke="#566367" stroke-width="3"/><path d="M22 123H113M22 130H113M22 137H113M22 144H113M22 151H113" stroke="#0d1c24" stroke-width="3"/><path d="M23 288H111V298H23Z" fill="#9e936e"/><path d="M24 288L34 298M45 288L55 298M66 288L76 298M87 288L97 298" stroke="#172127" stroke-width="7"/><path d="M89 195H107V229H89Z" fill="#0a141a" stroke="#708077"/><path d="M94 205H104V211H94Z" fill="#b37662"/><path d="M29 180L45 191M69 252L83 236M39 273L45 269" stroke="#acb3a0" opacity=".18"/><g fill="#778b89"><circle cx="12" cy="16" r="2"/><circle cx="123" cy="16" r="2"/><circle cx="12" cy="313" r="2"/><circle cx="123" cy="313" r="2"/></g>`,
    136,
    336,
  ),
  watcher: svg(
    `<path d="M63 18Q35 13 37 42L43 65Q29 66 24 88L14 154L5 183L8 203L14 176L19 206L22 176L30 125L34 111L29 190L38 223L33 299L45 311L54 306L50 225L65 222L71 309L85 310L83 299L81 217L77 176L76 110L86 148L91 182L93 211L98 183L105 207L104 171L96 139L89 84Q86 70 70 65L78 38Q77 18 63 18Z" fill="#030b0f"/><path d="M46 44L53 43M63 43L69 44" stroke="#cbded0" stroke-width="2"/><path d="M49 71L45 134M70 77L74 160M43 190L48 218" stroke="#314043" opacity=".3"/>`,
    112,
    320,
  ),
  robot: svg(
    `<path d="M27 23L61 23L64 48H24Z" fill="url(#metal)" stroke="#6c7e80"/><path d="M29 31H57V37H29Z" fill="#86b9a3"/><path d="M22 52H67L73 108L18 108Z" fill="url(#metal)" stroke="#74867f"/><path d="M31 63H59V91H31Z" fill="#14242a" stroke="#42595c"/><path d="M36 72H54M36 79H54" stroke="#8dab92"/><path d="M25 57L13 79L8 106M64 57L78 76L85 99M31 111L27 151L18 160H36L40 111M58 111L62 151L69 160H53L49 111" fill="none" stroke="#3e5157" stroke-width="10"/><g fill="#97a49b"><circle cx="13" cy="79" r="4"/><circle cx="78" cy="76" r="4"/><circle cx="27" cy="135" r="4"/><circle cx="62" cy="135" r="4"/></g>`,
    92,
    170,
  ),
};
