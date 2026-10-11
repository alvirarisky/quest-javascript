const prop = (body, w = 120, h = 160) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="m" x2="1" y2="1"><stop stop-color="#58656a"/><stop offset=".5" stop-color="#23343b"/><stop offset="1" stop-color="#101b22"/></linearGradient></defs>${body}</svg>`;
export const props = {
  locker: prop(
    `<rect x="14" y="6" width="94" height="302" rx="3" fill="url(#m)" stroke="#647a78" stroke-width="2"/><path d="M23 19H98V295H23Z" fill="#1b2a31" stroke="#3e555c"/><path d="M34 35H87M34 44H87M34 53H87M34 253H87M34 263H87" stroke="#0b151c" stroke-width="5"/><path d="M85 126V165" stroke="#8b988b" stroke-width="4"/><path d="M28 201L80 193M22 216L54 210" stroke="#738075" opacity=".22"/><path d="M14 307H26V319H14M96 307H108V319H96" fill="#08131a"/>`,
    120,
    320,
  ),
  drawer: prop(
    `<path d="M8 32H111V150H8Z" fill="url(#m)" stroke="#77877f"/><path d="M14 40H105V85H14Z M14 91H105V140H14Z" fill="#223038" stroke="#526468"/><path d="M43 56H77V62H43Z M43 108H77V114H43Z" fill="#0a141b" stroke="#6a7d7b"/><path d="M17 26H99V34H17Z" fill="#38484b"/><path d="M64 8L95 13L91 31L60 27Z" fill="#bfccba" stroke="#647773"/><path d="M68 15L85 18M68 21L80 23" stroke="#496662"/><path d="M8 150H17V159H8 M101 150H111V159H101" fill="#0b171d"/>`,
  ),
  fusebox: prop(
    `<rect x="13" y="9" width="92" height="145" rx="3" fill="url(#m)" stroke="#6c7c7c" stroke-width="2"/><rect x="24" y="22" width="69" height="91" fill="#0b1920" stroke="#405b5c"/><path d="M33 36H84M33 98H84" stroke="#829180" stroke-width="5"/><path d="M45 38V94M68 38V94" stroke="#284e4e" stroke-width="11"/><path d="M45 42V88M68 42V88" stroke="#a4b395" stroke-width="4"/><circle cx="83" cy="133" r="4" fill="#b48f61"/><path d="M26 125L40 143H12Z" fill="#a49366"/><path d="M26 131V136M26 139V140" stroke="#1d282b" stroke-width="2"/><g fill="#8e9a8d"><circle cx="19" cy="15" r="2"/><circle cx="98" cy="15" r="2"/><circle cx="19" cy="147" r="2"/><circle cx="98" cy="147" r="2"/></g>`,
  ),
  lever: prop(
    `<rect x="31" y="15" width="57" height="139" rx="3" fill="url(#m)" stroke="#697e7b"/><rect x="46" y="49" width="26" height="88" rx="7" fill="#07151d"/><path d="M58 118L59 40" stroke="#8f9b90" stroke-width="9"/><rect x="37" y="33" width="46" height="16" rx="4" fill="#9d6555" stroke="#c18b6b"/><path d="M37 140H82" stroke="#af9c6d" stroke-width="5"/>`,
  ),
  valve: prop(
    `<path d="M47 3H71V158H47Z" fill="url(#m)" stroke="#5b7271"/><path d="M4 103H116V123H4Z" fill="url(#m)" stroke="#5b7271"/><circle cx="59" cy="66" r="38" fill="#16262d" stroke="#93634f" stroke-width="7"/><path d="M59 31V101M25 66H94M35 41L84 91M35 91L84 41" stroke="#9f7155" stroke-width="5"/><circle cx="59" cy="66" r="10" fill="#1f333a" stroke="#919e8d"/>`,
  ),
  dial: prop(
    `<rect x="9" y="17" width="104" height="134" rx="3" fill="url(#m)" stroke="#5e7978"/><rect x="23" y="31" width="75" height="34" fill="#061b20" stroke="#486966"/><circle cx="60" cy="109" r="24" fill="#10242b" stroke="#7b8b7c" stroke-width="3"/><path d="M60 109L74 94" stroke="#aab69d" stroke-width="4"/><path d="M15 3V22M106 3V22" stroke="#8c9c8f" stroke-width="3"/>`,
  ),
};
