export interface Font {
  id: string;
  family: string;
  fullName: string;
  postScriptName: string;
  preview?: string;
  style: string;
  url: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  weight?: number;
}

export const DEFAULT_FONT: Font = {
  id: "font_roboto_bold",
  family: "Roboto",
  fullName: "Roboto Bold",
  postScriptName: "Roboto-Bold",
  style: "Roboto-Bold",
  url: "https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf",
  category: "sans-serif",
  weight: 700
};

export const FONTS: Font[] = [
  // Sans-serif fonts
  {
    id: "font_roboto",
    family: "Roboto",
    fullName: "Roboto Regular",
    postScriptName: "Roboto-Regular",
    style: "Roboto-Regular",
    url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.ttf",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_roboto_bold",
    family: "Roboto",
    fullName: "Roboto Bold",
    postScriptName: "Roboto-Bold",
    style: "Roboto-Bold",
    url: "https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf",
    category: "sans-serif",
    weight: 700
  },
  {
    id: "font_opensans",
    family: "Open Sans",
    fullName: "Open Sans Regular",
    postScriptName: "OpenSans-Regular",
    style: "OpenSans-Regular",
    url: "https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0b.ttf",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_opensans_bold",
    family: "Open Sans",
    fullName: "Open Sans Bold",
    postScriptName: "OpenSans-Bold",
    style: "OpenSans-Bold",
    url: "https://fonts.gstatic.com/s/opensans/v18/mem5YaGs126MiZpBA-UN7rgOUuhp.ttf",
    category: "sans-serif",
    weight: 700
  },
  {
    id: "font_montserrat",
    family: "Montserrat",
    fullName: "Montserrat Regular",
    postScriptName: "Montserrat-Regular",
    style: "Montserrat-Regular",
    url: "https://fonts.gstatic.com/s/montserrat/v15/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_montserrat_bold",
    family: "Montserrat",
    fullName: "Montserrat Bold",
    postScriptName: "Montserrat-Bold",
    style: "Montserrat-Bold",
    url: "https://fonts.gstatic.com/s/montserrat/v15/JTURjIg1_i6t8kCHKm45_dJE3gnD_g.ttf",
    category: "sans-serif",
    weight: 700
  },
  {
    id: "font_poppins",
    family: "Poppins",
    fullName: "Poppins Regular",
    postScriptName: "Poppins-Regular",
    style: "Poppins-Regular",
    url: "https://fonts.gstatic.com/s/poppins/v19/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_poppins_bold",
    family: "Poppins",
    fullName: "Poppins Bold",
    postScriptName: "Poppins-Bold",
    style: "Poppins-Bold",
    url: "https://fonts.gstatic.com/s/poppins/v19/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2",
    category: "sans-serif",
    weight: 700
  },
  {
    id: "font_lato",
    family: "Lato",
    fullName: "Lato Regular",
    postScriptName: "Lato-Regular",
    style: "Lato-Regular",
    url: "https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wXg.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_lato_bold",
    family: "Lato",
    fullName: "Lato Bold",
    postScriptName: "Lato-Bold",
    style: "Lato-Bold",
    url: "https://fonts.gstatic.com/s/lato/v23/S6u9w4BMUTPHh6UVSwiPGQ.woff2",
    category: "sans-serif",
    weight: 700
  },
  {
    id: "font_cabin_condensed",
    family: "Cabin Condensed",
    fullName: "Cabin Condensed Regular",
    postScriptName: "CabinCondensed-Regular",
    style: "CabinCondensed-Regular",
    url: "https://fonts.gstatic.com/s/cabincondensed/v14/nwpMtK6mNhBK2err_hqkYhHRqmwaYOjZ5HZl8Q.ttf",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_cabin_condensed_bold",
    family: "Cabin Condensed",
    fullName: "Cabin Condensed Bold",
    postScriptName: "CabinCondensed-Bold",
    style: "CabinCondensed-Bold",
    url: "https://fonts.gstatic.com/s/cabincondensed/v14/nwpJtK6mNhBK2err_hqkYhHRqmwi3Mf97F15-K1oqQ.ttf",
    category: "sans-serif",
    weight: 700
  },
  
  // Display fonts
  {
    id: "font_bebas",
    family: "Bebas Neue",
    fullName: "Bebas Neue Regular",
    postScriptName: "BebasNeue-Regular",
    style: "BebasNeue-Regular",
    url: "https://fonts.gstatic.com/s/bebasneue/v8/JTUSjIg69CK48gW7PXoo9WlhyyTh89Y.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_anton",
    family: "Anton",
    fullName: "Anton Regular",
    postScriptName: "Anton-Regular",
    style: "Anton-Regular",
    url: "https://fonts.gstatic.com/s/anton/v22/1Ptgg87LROyAm3Kz-C8.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_oswald",
    family: "Oswald",
    fullName: "Oswald Regular",
    postScriptName: "Oswald-Regular",
    style: "Oswald-Regular",
    url: "https://fonts.gstatic.com/s/oswald/v47/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUZiZQ.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_oswald_bold",
    family: "Oswald",
    fullName: "Oswald Bold",
    postScriptName: "Oswald-Bold",
    style: "Oswald-Bold",
    url: "https://fonts.gstatic.com/s/oswald/v47/TK3_WkUHHAIjg75cFRf3bXL8LICs1xZosUZiZQ.woff2",
    category: "display",
    weight: 700
  },
  {
    id: "font_bangers",
    family: "Bangers",
    fullName: "Bangers Regular",
    postScriptName: "Bangers-Regular",
    style: "Bangers-Regular",
    url: "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf",
    category: "display",
    weight: 400
  },
  {
    id: "font_chelsea_market",
    family: "Chelsea Market",
    fullName: "Chelsea Market Regular",
    postScriptName: "ChelseaMarket-Regular",
    style: "ChelseaMarket-Regular",
    url: "https://fonts.gstatic.com/s/chelseamarket/v8/BCawqZsHqfr89WNP_IApC8tzKBhlLA4uKkWk.ttf",
    category: "display",
    weight: 400
  },
  {
    id: "font_frijole",
    family: "Frijole",
    fullName: "Frijole Regular",
    postScriptName: "Frijole",
    style: "Frijole",
    url: "https://fonts.gstatic.com/s/frijole/v9/uU9PCBUR8oakM2BQ7xPb3vyHmlI.ttf",
    category: "display",
    weight: 400
  },
  {
    id: "font_impact",
    family: "Impact",
    fullName: "Impact Regular",
    postScriptName: "Impact",
    style: "Impact",
    url: "https://fonts.gstatic.com/s/impact/v17/HUBiSaL-HKAzIaOe9LcNAw.ttf",
    category: "display",
    weight: 400
  },
  
  // Serif fonts
  {
    id: "font_playfair",
    family: "Playfair Display",
    fullName: "Playfair Display Regular",
    postScriptName: "PlayfairDisplay-Regular",
    style: "PlayfairDisplay-Regular",
    url: "https://fonts.gstatic.com/s/playfairdisplay/v29/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtY.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_playfair_bold",
    family: "Playfair Display",
    fullName: "Playfair Display Bold",
    postScriptName: "PlayfairDisplay-Bold",
    style: "PlayfairDisplay-Bold",
    url: "https://fonts.gstatic.com/s/playfairdisplay/v29/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vXDXbtY.woff2",
    category: "serif",
    weight: 700
  },
  {
    id: "font_merriweather",
    family: "Merriweather",
    fullName: "Merriweather Regular",
    postScriptName: "Merriweather-Regular",
    style: "Merriweather-Regular",
    url: "https://fonts.gstatic.com/s/merriweather/v28/u-440qyriQwlOrhSvowK_l5-fCZJ.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_merriweather_bold",
    family: "Merriweather",
    fullName: "Merriweather Bold",
    postScriptName: "Merriweather-Bold",
    style: "Merriweather-Bold",
    url: "https://fonts.gstatic.com/s/merriweather/v28/u-4n0qyriQwlOrhSvowK_l52xwNZWMf6hPvhPQ.woff2",
    category: "serif",
    weight: 700
  },
  {
    id: "font_georgia",
    family: "Georgia",
    fullName: "Georgia Regular",
    postScriptName: "Georgia",
    style: "Georgia",
    url: "https://fonts.gstatic.com/s/georgia/v8/xU_AsoSTQNU1N3jeZ17U.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_times",
    family: "Times New Roman",
    fullName: "Times New Roman Regular",
    postScriptName: "TimesNewRoman",
    style: "TimesNewRoman",
    url: "https://fonts.gstatic.com/s/timesnewroman/v9/N0b7mCqv0R_2Ngo85JilT84KBXx1fMy5.woff2",
    category: "serif",
    weight: 400
  },
  
  // Handwriting fonts
  {
    id: "font_dancing",
    family: "Dancing Script",
    fullName: "Dancing Script Regular",
    postScriptName: "DancingScript-Regular",
    style: "DancingScript-Regular",
    url: "https://fonts.gstatic.com/s/dancingscript/v22/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3Sup6.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_dancing_bold",
    family: "Dancing Script",
    fullName: "Dancing Script Bold",
    postScriptName: "DancingScript-Bold",
    style: "DancingScript-Bold",
    url: "https://fonts.gstatic.com/s/dancingscript/v22/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7B1i43Sup6.woff2",
    category: "handwriting",
    weight: 700
  },
  {
    id: "font_pacifico",
    family: "Pacifico",
    fullName: "Pacifico Regular",
    postScriptName: "Pacifico-Regular",
    style: "Pacifico-Regular",
    url: "https://fonts.gstatic.com/s/pacifico/v21/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_satisfy",
    family: "Satisfy",
    fullName: "Satisfy Regular",
    postScriptName: "Satisfy-Regular",
    style: "Satisfy-Regular",
    url: "https://fonts.gstatic.com/s/satisfy/v16/rP2Hp2yn6lkG50LoCZOIHQ.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_kaushan",
    family: "Kaushan Script",
    fullName: "Kaushan Script Regular",
    postScriptName: "KaushanScript-Regular",
    style: "KaushanScript-Regular",
    url: "https://fonts.gstatic.com/s/kaushanscript/v13/vm8vdRfvXFLG3OLnsO15WYS5DG74wNI.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_aguafina",
    family: "Aguafina Script",
    fullName: "Aguafina Script Regular",
    postScriptName: "AguafinaScript-Regular",
    style: "AguafinaScript-Regular",
    url: "https://fonts.gstatic.com/s/aguafinascript/v9/If2QXTv_ZzSxGIO30LemWEOmt1bHqs4pgicOrg.ttf",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_gaegu",
    family: "Gaegu",
    fullName: "Gaegu Regular",
    postScriptName: "Gaegu-Regular",
    style: "Gaegu-Regular",
    url: "https://fonts.gstatic.com/s/gaegu/v10/TuGfUVB6Up9NU6ZLodgzydtk.ttf",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_gaegu_bold",
    family: "Gaegu",
    fullName: "Gaegu Bold",
    postScriptName: "Gaegu-Bold",
    style: "Gaegu-Bold",
    url: "https://fonts.gstatic.com/s/gaegu/v10/TuGSUVB6Up9NU573jvw74sdtBk0x.ttf",
    category: "handwriting",
    weight: 700
  },
  
  // Monospace fonts
  {
    id: "font_roboto_mono",
    family: "Roboto Mono",
    fullName: "Roboto Mono Regular",
    postScriptName: "RobotoMono-Regular",
    style: "RobotoMono-Regular",
    url: "https://fonts.gstatic.com/s/robotomono/v21/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vq_ROW4.woff2",
    category: "monospace",
    weight: 400
  },
  {
    id: "font_roboto_mono_bold",
    family: "Roboto Mono",
    fullName: "Roboto Mono Bold",
    postScriptName: "RobotoMono-Bold",
    style: "RobotoMono-Bold",
    url: "https://fonts.gstatic.com/s/robotomono/v21/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of-_ROW4.woff2",
    category: "monospace",
    weight: 700
  },
  {
    id: "font_anonymous",
    family: "Anonymous Pro",
    fullName: "Anonymous Pro Regular",
    postScriptName: "AnonymousPro-Regular",
    style: "AnonymousPro-Regular",
    url: "https://fonts.gstatic.com/s/anonymouspro/v14/rP2Bp2a15UIB7Un-bOeISG3pLlw89CH98Ko.ttf",
    category: "monospace",
    weight: 400
  },
  {
    id: "font_anonymous_bold",
    family: "Anonymous Pro",
    fullName: "Anonymous Pro Bold",
    postScriptName: "AnonymousPro-Bold",
    style: "AnonymousPro-Bold",
    url: "https://fonts.gstatic.com/s/anonymouspro/v14/rP2cp2a15UIB7Un-bOeISG3pFuAT0CnW7KOywKo.ttf",
    category: "monospace",
    weight: 700
  },
  {
    id: "font_courier",
    family: "Courier New",
    fullName: "Courier New Regular",
    postScriptName: "CourierNew",
    style: "CourierNew",
    url: "https://fonts.gstatic.com/s/couriernew/v8/M8JmuRXxlObYn9lXLb4jSuE.woff2",
    category: "monospace",
    weight: 400
  },
  
  // Additional fonts from react_video_editor
  {
    id: "font_abril_fatface",
    family: "Abril Fatface",
    fullName: "Abril Fatface Regular",
    postScriptName: "AbrilFatface-Regular",
    style: "AbrilFatface-Regular",
    url: "https://fonts.gstatic.com/s/abrilfatface/v12/zOL64pLDlL1D99S8g8PtiKchm-BsjOLhZBY.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_acme",
    family: "Acme",
    fullName: "Acme Regular",
    postScriptName: "Acme-Regular",
    style: "Acme-Regular",
    url: "https://fonts.gstatic.com/s/acme/v11/RrQfboBx-C5_bx3Lb23lzLk.ttf",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_alfa_slab",
    family: "Alfa Slab One",
    fullName: "Alfa Slab One Regular",
    postScriptName: "AlfaSlabOne-Regular",
    style: "AlfaSlabOne-Regular",
    url: "https://fonts.gstatic.com/s/alfaslabone/v10/6NUQ8FmMKwSEKjnm5-4v-4Jh6dVretWvYmE.ttf",
    category: "display",
    weight: 400
  },
  {
    id: "font_allura",
    family: "Allura",
    fullName: "Allura Regular",
    postScriptName: "Allura-Regular",
    style: "Allura-Regular",
    url: "https://fonts.gstatic.com/s/allura/v15/9oRPNYsQpS4zjuAPjAIXPtrrGA.ttf",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_amatic_sc",
    family: "Amatic SC",
    fullName: "Amatic SC Regular",
    postScriptName: "AmaticSC-Regular",
    style: "AmaticSC-Regular",
    url: "https://fonts.gstatic.com/s/amaticsc/v16/TUZyzwprpvBS1izr_vO0De6ecZQf1A.ttf",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_amatic_sc_bold",
    family: "Amatic SC",
    fullName: "Amatic SC Bold",
    postScriptName: "AmaticSC-Bold",
    style: "AmaticSC-Bold",
    url: "https://fonts.gstatic.com/s/amaticsc/v16/TUZ3zwprpvBS1izr_vOMscG6eb8D3WTy-A.ttf",
    category: "handwriting",
    weight: 700
  },
  {
    id: "font_archivo",
    family: "Archivo",
    fullName: "Archivo Regular",
    postScriptName: "Archivo-Regular",
    style: "Archivo-Regular",
    url: "https://fonts.gstatic.com/s/archivo/v18/k3kVo8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDNp8w.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_archivo_black",
    family: "Archivo Black",
    fullName: "Archivo Black Regular",
    postScriptName: "ArchivoBlack-Regular",
    style: "ArchivoBlack-Regular",
    url: "https://fonts.gstatic.com/s/archivoblack/v11/HTxqL289NzCGg4MzN6KJ7eW6OYuP_x7yx3A.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_arvo",
    family: "Arvo",
    fullName: "Arvo Regular",
    postScriptName: "Arvo-Regular",
    style: "Arvo-Regular",
    url: "https://fonts.gstatic.com/s/arvo/v14/tDbD2oWUg0MKqScQ7Q.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_arvo_bold",
    family: "Arvo",
    fullName: "Arvo Bold",
    postScriptName: "Arvo-Bold",
    style: "Arvo-Bold",
    url: "https://fonts.gstatic.com/s/arvo/v14/tDbM2oWUg0MKoZw1-LPK89D4hAA.woff2",
    category: "serif",
    weight: 700
  },
  {
    id: "font_barlow",
    family: "Barlow",
    fullName: "Barlow Regular",
    postScriptName: "Barlow-Regular",
    style: "Barlow-Regular",
    url: "https://fonts.gstatic.com/s/barlow/v12/7cHqv4kjgoGqM7E3t-4s51os.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_barlow_condensed",
    family: "Barlow Condensed",
    fullName: "Barlow Condensed Regular",
    postScriptName: "BarlowCondensed-Regular",
    style: "BarlowCondensed-Regular",
    url: "https://fonts.gstatic.com/s/barlowcondensed/v12/HTx3L3I-JCGChYJ8VI-L6OO_au7B2xbZ23n3pKg.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_bitter",
    family: "Bitter",
    fullName: "Bitter Regular",
    postScriptName: "Bitter-Regular",
    style: "Bitter-Regular",
    url: "https://fonts.gstatic.com/s/bitter/v19/raxhHiqOu8IVPmnRc6SY1KXhnF_Y8fbfCL_EXFh2reU.ttf",
    category: "serif",
    weight: 400
  },
  {
    id: "font_bungee",
    family: "Bungee",
    fullName: "Bungee Regular",
    postScriptName: "Bungee-Regular",
    style: "Bungee-Regular",
    url: "https://fonts.gstatic.com/s/bungee/v11/N0bU2SZBIuF2PU_ECn50Kd_PmA.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_cabin",
    family: "Cabin",
    fullName: "Cabin Regular",
    postScriptName: "Cabin-Regular",
    style: "Cabin-Regular",
    url: "https://fonts.gstatic.com/s/cabin/v18/u-4X0qWljRw-PfU81xCKCpdpbgZJl6XFpfEd7eA9BIxxkV2EL7Gvxm7rE_s.ttf",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_cairo",
    family: "Cairo",
    fullName: "Cairo Regular",
    postScriptName: "Cairo-Regular",
    style: "Cairo-Regular",
    url: "https://fonts.gstatic.com/s/cairo/v17/SLXGc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1ToLQ-HmkA.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_comfortaa",
    family: "Comfortaa",
    fullName: "Comfortaa Regular",
    postScriptName: "Comfortaa-Regular",
    style: "Comfortaa-Regular",
    url: "https://fonts.gstatic.com/s/comfortaa/v30/1Pt_g8LJRfWJmhDAuUsSQamb1W0lwk4S4WjMPrQVIT9c2c8.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_cookie",
    family: "Cookie",
    fullName: "Cookie Regular",
    postScriptName: "Cookie-Regular",
    style: "Cookie-Regular",
    url: "https://fonts.gstatic.com/s/cookie/v12/syky-y18lb0tSbfNlQCT9tPdpw.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_cormorant_garamond",
    family: "Cormorant Garamond",
    fullName: "Cormorant Garamond Regular",
    postScriptName: "CormorantGaramond-Regular",
    style: "CormorantGaramond-Regular",
    url: "https://fonts.gstatic.com/s/cormorantgaramond/v10/co3bmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.ttf",
    category: "serif",
    weight: 400
  },
  {
    id: "font_courgette",
    family: "Courgette",
    fullName: "Courgette Regular",
    postScriptName: "Courgette-Regular",
    style: "Courgette-Regular",
    url: "https://fonts.gstatic.com/s/courgette/v8/wEO_EBrAnc9BLjLQAUkFUfAL3EsHiA.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_creepster",
    family: "Creepster",
    fullName: "Creepster Regular",
    postScriptName: "Creepster-Regular",
    style: "Creepster-Regular",
    url: "https://fonts.gstatic.com/s/creepster/v9/AlZy_zVUqJz4yMrniH4hdXf4XB0Tow.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_crimson_text",
    family: "Crimson Text",
    fullName: "Crimson Text Regular",
    postScriptName: "CrimsonText-Regular",
    style: "CrimsonText-Regular",
    url: "https://fonts.gstatic.com/s/crimsontext/v11/wlp2gwHKFkZgtmSR3NB0oRJfbwhTIfFd3A.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_dm_sans",
    family: "DM Sans",
    fullName: "DM Sans Regular",
    postScriptName: "DMSans-Regular",
    style: "DMSans-Regular",
    url: "https://fonts.gstatic.com/s/dmsans/v11/rP2Hp2ywxg089UriOZSCHBeHFl0.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_dm_serif_display",
    family: "DM Serif Display",
    fullName: "DM Serif Display Regular",
    postScriptName: "DMSerifDisplay-Regular",
    style: "DMSerifDisplay-Regular",
    url: "https://fonts.gstatic.com/s/dmserifdisplay/v10/-nFnOHM81r4j6k0gjAW3mujVU2B2G_5x0ujy.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_dosis",
    family: "Dosis",
    fullName: "Dosis Regular",
    postScriptName: "Dosis-Regular",
    style: "Dosis-Regular",
    url: "https://fonts.gstatic.com/s/dosis/v19/HhyJU5sn9vOmLxNkIwRSjTVNWLEJN7Ml2xME_Io.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_eb_garamond",
    family: "EB Garamond",
    fullName: "EB Garamond Regular",
    postScriptName: "EBGaramond-Regular",
    style: "EBGaramond-Regular",
    url: "https://fonts.gstatic.com/s/ebgaramond/v20/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-2fRUA4V-e_6.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_exo",
    family: "Exo",
    fullName: "Exo Regular",
    postScriptName: "Exo-Regular",
    style: "Exo-Regular",
    url: "https://fonts.gstatic.com/s/exo/v12/4UaZrEtFpBI4f1ZSIK9d4LjJ4lM3OwRmO3ws.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_exo_2",
    family: "Exo 2",
    fullName: "Exo 2 Regular",
    postScriptName: "Exo2-Regular",
    style: "Exo2-Regular",
    url: "https://fonts.gstatic.com/s/exo2/v10/7cH1v4okm5zmbvwkAx_sfcEuiD8jvvOcPtq-rpvLpQ.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_fira_sans",
    family: "Fira Sans",
    fullName: "Fira Sans Regular",
    postScriptName: "FiraSans-Regular",
    style: "FiraSans-Regular",
    url: "https://fonts.gstatic.com/s/firasans/v11/va9E4kDNxMZdWfMOD5VvmojLazX3dGTP.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_fjalla_one",
    family: "Fjalla One",
    fullName: "Fjalla One Regular",
    postScriptName: "FjallaOne-Regular",
    style: "FjallaOne-Regular",
    url: "https://fonts.gstatic.com/s/fjallaone/v8/Yq6R-LCAWCX3-6Ky7FAFnOZwkxgtUb8.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_fredoka_one",
    family: "Fredoka One",
    fullName: "Fredoka One Regular",
    postScriptName: "FredokaOne-Regular",
    style: "FredokaOne-Regular",
    url: "https://fonts.gstatic.com/s/fredokaone/v8/k3kUo8kEI-tA1RRcTZGmTlHGCaen8wf-.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_great_vibes",
    family: "Great Vibes",
    fullName: "Great Vibes Regular",
    postScriptName: "GreatVibes-Regular",
    style: "GreatVibes-Regular",
    url: "https://fonts.gstatic.com/s/greatvibes/v11/RWmMoKWR9v4ksMfaWd_JN-XCg6UKDXlq.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_heebo",
    family: "Heebo",
    fullName: "Heebo Regular",
    postScriptName: "Heebo-Regular",
    style: "Heebo-Regular",
    url: "https://fonts.gstatic.com/s/heebo/v10/NGS6v5_NC0k9P9H2TbE.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_hind",
    family: "Hind",
    fullName: "Hind Regular",
    postScriptName: "Hind-Regular",
    style: "Hind-Regular",
    url: "https://fonts.gstatic.com/s/hind/v11/5aU69_a8oxmIdGl4Ag.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_inconsolata",
    family: "Inconsolata",
    fullName: "Inconsolata Regular",
    postScriptName: "Inconsolata-Regular",
    style: "Inconsolata-Regular",
    url: "https://fonts.gstatic.com/s/inconsolata/v21/QlddNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLyya15IDhunJ_o.woff2",
    category: "monospace",
    weight: 400
  },
  {
    id: "font_indie_flower",
    family: "Indie Flower",
    fullName: "Indie Flower Regular",
    postScriptName: "IndieFlower-Regular",
    style: "IndieFlower-Regular",
    url: "https://fonts.gstatic.com/s/indieflower/v12/m8JVjfNVeKWVnh3QMuKkFcZVaUuH99GUDg.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_josefin_sans",
    family: "Josefin Sans",
    fullName: "Josefin Sans Regular",
    postScriptName: "JosefinSans-Regular",
    style: "JosefinSans-Regular",
    url: "https://fonts.gstatic.com/s/josefinsans/v17/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_DjQbMZhKg.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_julius_sans_one",
    family: "Julius Sans One",
    fullName: "Julius Sans One Regular",
    postScriptName: "JuliusSansOne-Regular",
    style: "JuliusSansOne-Regular",
    url: "https://fonts.gstatic.com/s/juliussansone/v9/1Pt2g8TAX_SGgBGUi0tGOYEga5W-xXEW6aGXHw.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_kanit",
    family: "Kanit",
    fullName: "Kanit Regular",
    postScriptName: "Kanit-Regular",
    style: "Kanit-Regular",
    url: "https://fonts.gstatic.com/s/kanit/v11/nKKZ-Go6G5tXcraBGwCYdA.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_karla",
    family: "Karla",
    fullName: "Karla Regular",
    postScriptName: "Karla-Regular",
    style: "Karla-Regular",
    url: "https://fonts.gstatic.com/s/karla/v15/qkBbXvYC6trAT7RbLtyG5Q.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_lexend",
    family: "Lexend",
    fullName: "Lexend Regular",
    postScriptName: "Lexend-Regular",
    style: "Lexend-Regular",
    url: "https://fonts.gstatic.com/s/lexend/v8/wlptgwvFAVdoq2_F94zlCfv0bz1WCzsX_LBte6KuGEo.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_libre_baskerville",
    family: "Libre Baskerville",
    fullName: "Libre Baskerville Regular",
    postScriptName: "LibreBaskerville-Regular",
    style: "LibreBaskerville-Regular",
    url: "https://fonts.gstatic.com/s/librebaskerville/v9/kmKnZrc3Hgbbcjq75U4uslyuy4kn0pNeYRI4CN2V.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_libre_franklin",
    family: "Libre Franklin",
    fullName: "Libre Franklin Regular",
    postScriptName: "LibreFranklin-Regular",
    style: "LibreFranklin-Regular",
    url: "https://fonts.gstatic.com/s/librefranklin/v9/jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhLsSlCQ.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_lobster",
    family: "Lobster",
    fullName: "Lobster Regular",
    postScriptName: "Lobster-Regular",
    style: "Lobster-Regular",
    url: "https://fonts.gstatic.com/s/lobster/v22/neILzCirqoswsqX9_oWsMqEzSJQ.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_lobster_two",
    family: "Lobster Two",
    fullName: "Lobster Two Regular",
    postScriptName: "LobsterTwo-Regular",
    style: "LobsterTwo-Regular",
    url: "https://fonts.gstatic.com/s/lobstertwo/v13/BngMUXZGTXPUvIoyV6yN5-fN5qU.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_lora",
    family: "Lora",
    fullName: "Lora Regular",
    postScriptName: "Lora-Regular",
    style: "Lora-Regular",
    url: "https://fonts.gstatic.com/s/lora/v17/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqs.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_luckiest_guy",
    family: "Luckiest Guy",
    fullName: "Luckiest Guy Regular",
    postScriptName: "LuckiestGuy-Regular",
    style: "LuckiestGuy-Regular",
    url: "https://fonts.gstatic.com/s/luckiestguy/v11/_gP_1RrxsjcxVyin9l9n_j2hTd52ijI.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_muli",
    family: "Muli",
    fullName: "Muli Regular",
    postScriptName: "Muli-Regular",
    style: "Muli-Regular",
    url: "https://fonts.gstatic.com/s/muli/v22/7Aulp_0qiz-aVz7u3PJLcUMYOFnOkEk40eiNxw.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_noto_sans",
    family: "Noto Sans",
    fullName: "Noto Sans Regular",
    postScriptName: "NotoSans-Regular",
    style: "NotoSans-Regular",
    url: "https://fonts.gstatic.com/s/notosans/v11/o-0IIpQlx3QUlC5A4PNr5TRA.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_noto_serif",
    family: "Noto Serif",
    fullName: "Noto Serif Regular",
    postScriptName: "NotoSerif-Regular",
    style: "NotoSerif-Regular",
    url: "https://fonts.gstatic.com/s/notoserif/v9/ga6Iaw1J5X9T9RW6j9bNfFcWaA.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_nunito",
    family: "Nunito",
    fullName: "Nunito Regular",
    postScriptName: "Nunito-Regular",
    style: "Nunito-Regular",
    url: "https://fonts.gstatic.com/s/nunito/v16/XRXV3I6Li01BKofINeaB.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_nunito_sans",
    family: "Nunito Sans",
    fullName: "Nunito Sans Regular",
    postScriptName: "NunitoSans-Regular",
    style: "NunitoSans-Regular",
    url: "https://fonts.gstatic.com/s/nunitosans/v6/pe0qMImSLYBIv1o4X1M8cce9I9s.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_old_standard_tt",
    family: "Old Standard TT",
    fullName: "Old Standard TT Regular",
    postScriptName: "OldStandardTT-Regular",
    style: "OldStandardTT-Regular",
    url: "https://fonts.gstatic.com/s/oldstandardtt/v13/MwQubh3o1vLImiwAVvYawgcf2eVurVC5RHdCZg.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_orbitron",
    family: "Orbitron",
    fullName: "Orbitron Regular",
    postScriptName: "Orbitron-Regular",
    style: "Orbitron-Regular",
    url: "https://fonts.gstatic.com/s/orbitron/v17/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6xpmIyXjU1pg.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_oxygen",
    family: "Oxygen",
    fullName: "Oxygen Regular",
    postScriptName: "Oxygen-Regular",
    style: "Oxygen-Regular",
    url: "https://fonts.gstatic.com/s/oxygen/v10/2sDfZG1Wl4LcnbuKjk0g.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_permanent_marker",
    family: "Permanent Marker",
    fullName: "Permanent Marker Regular",
    postScriptName: "PermanentMarker-Regular",
    style: "PermanentMarker-Regular",
    url: "https://fonts.gstatic.com/s/permanentmarker/v10/Fh4uPib9Iyv2ucM6pGQMWimMp004La2Cfw.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_play",
    family: "Play",
    fullName: "Play Regular",
    postScriptName: "Play-Regular",
    style: "Play-Regular",
    url: "https://fonts.gstatic.com/s/play/v11/6aez4K2oVqwIvtg2H68T.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_poiret_one",
    family: "Poiret One",
    fullName: "Poiret One Regular",
    postScriptName: "PoiretOne-Regular",
    style: "PoiretOne-Regular",
    url: "https://fonts.gstatic.com/s/poiretone/v9/UqyVK80NJXN4zfRgbdfbk5lWVscxdKE.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_prata",
    family: "Prata",
    fullName: "Prata Regular",
    postScriptName: "Prata-Regular",
    style: "Prata-Regular",
    url: "https://fonts.gstatic.com/s/prata/v13/6xKhdSpbNNCT-vWIAG_5LWwJ.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_prompt",
    family: "Prompt",
    fullName: "Prompt Regular",
    postScriptName: "Prompt-Regular",
    style: "Prompt-Regular",
    url: "https://fonts.gstatic.com/s/prompt/v5/-W__XJnvUD7dzB2KYNodVkI.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_pt_mono",
    family: "PT Mono",
    fullName: "PT Mono Regular",
    postScriptName: "PTMono-Regular",
    style: "PTMono-Regular",
    url: "https://fonts.gstatic.com/s/ptmono/v8/9oRONYoBnWILk-9ArCg5MtPyAcg.woff2",
    category: "monospace",
    weight: 400
  },
  {
    id: "font_pt_sans",
    family: "PT Sans",
    fullName: "PT Sans Regular",
    postScriptName: "PTSans-Regular",
    style: "PTSans-Regular",
    url: "https://fonts.gstatic.com/s/ptsans/v12/jizaRExUiTo99u79D0-ExdGM.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_pt_serif",
    family: "PT Serif",
    fullName: "PT Serif Regular",
    postScriptName: "PTSerif-Regular",
    style: "PTSerif-Regular",
    url: "https://fonts.gstatic.com/s/ptserif/v12/EJRVQgYoZZY2vCFuvAFbzr-_dSb_.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_quattrocento",
    family: "Quattrocento",
    fullName: "Quattrocento Regular",
    postScriptName: "Quattrocento-Regular",
    style: "Quattrocento-Regular",
    url: "https://fonts.gstatic.com/s/quattrocento/v12/OZpEg_xvsDZQL_LKIF7q4jPHxGL7f4jFuA.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_quattrocento_sans",
    family: "Quattrocento Sans",
    fullName: "Quattrocento Sans Regular",
    postScriptName: "QuattrocentoSans-Regular",
    style: "QuattrocentoSans-Regular",
    url: "https://fonts.gstatic.com/s/quattrocentosans/v12/va9c4lja2NVIDdIAAoMR5MfuElaRB3zOvU7eHGHJ.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_questrial",
    family: "Questrial",
    fullName: "Questrial Regular",
    postScriptName: "Questrial-Regular",
    style: "Questrial-Regular",
    url: "https://fonts.gstatic.com/s/questrial/v13/QdVAS8-1xZ6rATLC_8KaCeVPmDQ.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_quicksand",
    family: "Quicksand",
    fullName: "Quicksand Regular",
    postScriptName: "Quicksand-Regular",
    style: "Quicksand-Regular",
    url: "https://fonts.gstatic.com/s/quicksand/v22/6xKtdSZaM9iE8KbpRA_hJFQNcOM.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_rajdhani",
    family: "Rajdhani",
    fullName: "Rajdhani Regular",
    postScriptName: "Rajdhani-Regular",
    style: "Rajdhani-Regular",
    url: "https://fonts.gstatic.com/s/rajdhani/v10/LDIxapCSOBg7S-QT7q4AOeekWPrP.ttf",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_raleway",
    family: "Raleway",
    fullName: "Raleway Regular",
    postScriptName: "Raleway-Regular",
    style: "Raleway-Regular",
    url: "https://fonts.gstatic.com/s/raleway/v18/1Ptug8zYS_SKggPNyC0ITw.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_righteous",
    family: "Righteous",
    fullName: "Righteous Regular",
    postScriptName: "Righteous-Regular",
    style: "Righteous-Regular",
    url: "https://fonts.gstatic.com/s/righteous/v9/1cXxaUPXBpj2rGoU7C9WiHGFq8Kk1Q.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_rokkitt",
    family: "Rokkitt",
    fullName: "Rokkitt Regular",
    postScriptName: "Rokkitt-Regular",
    style: "Rokkitt-Regular",
    url: "https://fonts.gstatic.com/s/rokkitt/v20/qFdb35qfgYFjGy5hukqqhw5XeRgdi1rydpDLE76HvN6n.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_rubik",
    family: "Rubik",
    fullName: "Rubik Regular",
    postScriptName: "Rubik-Regular",
    style: "Rubik-Regular",
    url: "https://fonts.gstatic.com/s/rubik/v11/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4iFV0U1.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_russo_one",
    family: "Russo One",
    fullName: "Russo One Regular",
    postScriptName: "RussoOne-Regular",
    style: "RussoOne-Regular",
    url: "https://fonts.gstatic.com/s/russoone/v9/Z9XUDmZRWg6M1LvRYsHOz8mJvLuL9A.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_sacramento",
    family: "Sacramento",
    fullName: "Sacramento Regular",
    postScriptName: "Sacramento-Regular",
    style: "Sacramento-Regular",
    url: "https://fonts.gstatic.com/s/sacramento/v8/buEzpo6gcdjy0EiZMBUG4C0f_f5Iai0.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_shadows_into_light",
    family: "Shadows Into Light",
    fullName: "Shadows Into Light Regular",
    postScriptName: "ShadowsIntoLight-Regular",
    style: "ShadowsIntoLight-Regular",
    url: "https://fonts.gstatic.com/s/shadowsintolight/v10/UqyNK9UOIntux_czAvDQx_ZcHqZXBNQzdcD55TecYQ.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_signika",
    family: "Signika",
    fullName: "Signika Regular",
    postScriptName: "Signika-Regular",
    style: "Signika-Regular",
    url: "https://fonts.gstatic.com/s/signika/v11/vEFR2_JTCgwQ5ejvG18mBlprZ0gk0w.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_slabo_27px",
    family: "Slabo 27px",
    fullName: "Slabo 27px Regular",
    postScriptName: "Slabo27px-Regular",
    style: "Slabo27px-Regular",
    url: "https://fonts.gstatic.com/s/slabo27px/v8/mFT0WbgBwKPR_Z4hGN2qgx8D1Q.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_source_code_pro",
    family: "Source Code Pro",
    fullName: "Source Code Pro Regular",
    postScriptName: "SourceCodePro-Regular",
    style: "SourceCodePro-Regular",
    url: "https://fonts.gstatic.com/s/sourcecodepro/v13/HI_SiYsKILxRpg3hIP6sJ7fM7PqlPevWnsUnxg.woff2",
    category: "monospace",
    weight: 400
  },
  {
    id: "font_source_sans_pro",
    family: "Source Sans Pro",
    fullName: "Source Sans Pro Regular",
    postScriptName: "SourceSansPro-Regular",
    style: "SourceSansPro-Regular",
    url: "https://fonts.gstatic.com/s/sourcesanspro/v14/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7l.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_space_mono",
    family: "Space Mono",
    fullName: "Space Mono Regular",
    postScriptName: "SpaceMono-Regular",
    style: "SpaceMono-Regular",
    url: "https://fonts.gstatic.com/s/spacemono/v6/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff2",
    category: "monospace",
    weight: 400
  },
  {
    id: "font_spectral",
    family: "Spectral",
    fullName: "Spectral Regular",
    postScriptName: "Spectral-Regular",
    style: "Spectral-Regular",
    url: "https://fonts.gstatic.com/s/spectral/v7/rnCr-xNNww_2s0amA-M-mHnOSOuk.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_staatliches",
    family: "Staatliches",
    fullName: "Staatliches Regular",
    postScriptName: "Staatliches-Regular",
    style: "Staatliches-Regular",
    url: "https://fonts.gstatic.com/s/staatliches/v5/HI_OiY8KO6hCsQSoAPmtMYebvpA.woff2",
    category: "display",
    weight: 400
  },
  {
    id: "font_tajawal",
    family: "Tajawal",
    fullName: "Tajawal Regular",
    postScriptName: "Tajawal-Regular",
    style: "Tajawal-Regular",
    url: "https://fonts.gstatic.com/s/tajawal/v4/Iura6YBj_oCad4k1nzGBC5vNeg.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_titillium_web",
    family: "Titillium Web",
    fullName: "Titillium Web Regular",
    postScriptName: "TitilliumWeb-Regular",
    style: "TitilliumWeb-Regular",
    url: "https://fonts.gstatic.com/s/titilliumweb/v9/NaPecZTIAOhVxoMyOr9n_E7fdMPmDQ.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_ubuntu",
    family: "Ubuntu",
    fullName: "Ubuntu Regular",
    postScriptName: "Ubuntu-Regular",
    style: "Ubuntu-Regular",
    url: "https://fonts.gstatic.com/s/ubuntu/v15/4iCs6KVjbNBYlgoKfw72.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_ubuntu_condensed",
    family: "Ubuntu Condensed",
    fullName: "Ubuntu Condensed Regular",
    postScriptName: "UbuntuCondensed-Regular",
    style: "UbuntuCondensed-Regular",
    url: "https://fonts.gstatic.com/s/ubuntucondensed/v11/u-4k0rCzjgs5J7oXnJcM_0kACGMtT-Dfqw.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_ubuntu_mono",
    family: "Ubuntu Mono",
    fullName: "Ubuntu Mono Regular",
    postScriptName: "UbuntuMono-Regular",
    style: "UbuntuMono-Regular",
    url: "https://fonts.gstatic.com/s/ubuntumono/v10/KFOjCneDtsqEr0keqCMhbCc6CsQ.woff2",
    category: "monospace",
    weight: 400
  },
  {
    id: "font_varela_round",
    family: "Varela Round",
    fullName: "Varela Round Regular",
    postScriptName: "VarelaRound-Regular",
    style: "VarelaRound-Regular",
    url: "https://fonts.gstatic.com/s/varelaround/v13/w8gdH283Tvk__Lua32TysjIfp8uPLdshZg.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_vollkorn",
    family: "Vollkorn",
    fullName: "Vollkorn Regular",
    postScriptName: "Vollkorn-Regular",
    style: "Vollkorn-Regular",
    url: "https://fonts.gstatic.com/s/vollkorn/v12/0yb9GDoxxrvAnPhYGxksckM2WMCpRjDj-DJGWlmeNsg.woff2",
    category: "serif",
    weight: 400
  },
  {
    id: "font_work_sans",
    family: "Work Sans",
    fullName: "Work Sans Regular",
    postScriptName: "WorkSans-Regular",
    style: "WorkSans-Regular",
    url: "https://fonts.gstatic.com/s/worksans/v8/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXNig.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_yanone_kaffeesatz",
    family: "Yanone Kaffeesatz",
    fullName: "Yanone Kaffeesatz Regular",
    postScriptName: "YanoneKaffeesatz-Regular",
    style: "YanoneKaffeesatz-Regular",
    url: "https://fonts.gstatic.com/s/yanonekaffeesatz/v15/3y9I6aknfjLm_3lMKjiMgmUUYBs04aUXNxt9gW2LIfto.woff2",
    category: "sans-serif",
    weight: 400
  },
  {
    id: "font_yellowtail",
    family: "Yellowtail",
    fullName: "Yellowtail Regular",
    postScriptName: "Yellowtail-Regular",
    style: "Yellowtail-Regular",
    url: "https://fonts.gstatic.com/s/yellowtail/v11/OZpGg_pnoDtINPfRIlLotlzNwED-b4g.woff2",
    category: "handwriting",
    weight: 400
  },
  {
    id: "font_zilla_slab",
    family: "Zilla Slab",
    fullName: "Zilla Slab Regular",
    postScriptName: "ZillaSlab-Regular",
    style: "ZillaSlab-Regular",
    url: "https://fonts.gstatic.com/s/zillaslab/v6/dFa6ZfeM_74wlPZtksIFajo6_Q.woff2",
    category: "serif",
    weight: 400
  }
];

// Group fonts by family for easier selection
export const FONT_FAMILIES = FONTS.reduce((acc, font) => {
  if (!acc[font.family]) {
    acc[font.family] = [];
  }
  acc[font.family].push(font);
  return acc;
}, {} as Record<string, Font[]>);

// Get default font for each family (prefer Regular weight)
export const getDefaultFontForFamily = (family: string): Font => {
  const familyFonts = FONT_FAMILIES[family];
  if (!familyFonts || familyFonts.length === 0) {
    return DEFAULT_FONT;
  }
  
  // Try to find regular weight
  const regularFont = familyFonts.find(f => 
    f.fullName.toLowerCase().includes('regular') || 
    f.weight === 400
  );
  
  return regularFont || familyFonts[0];
};

// Get all unique font families
export const FONT_FAMILY_NAMES = Object.keys(FONT_FAMILIES).sort();

// Font categories for filtering
export const FONT_CATEGORIES = [
  { value: 'all', label: 'All Fonts' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' }
];