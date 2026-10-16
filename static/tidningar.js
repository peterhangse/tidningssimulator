/*
 * Tidningarna man kan välja i framsidebyggaren.
 *
 * Titlarna är Gota Medias dagstidningar enligt Mediestudiers kommundatabas (okt 2026):
 * https://kommundatabas.mediestudier.se/koncern/gota-media/
 *
 * bild:  en egen bild av sidhuvudet (bara Blekinge Läns Tidning har det i dag).
 *        Utan bild ritas ett övningshuvud med tidningens namn i vanligt typsnitt
 *        och huvudfärg, i samma uppställning som BLT-huvudet. Det är inte tidningens
 *        egen logotyp.
 * farg:  tidningens huvudfärg. null = mörkgrått tills färgen är bestämd.
 * webb:  adressen som står under datumet. null = raden visas inte.
 * pris:  t.ex. 'Pris 39 kronor'. null = raden visas inte.
 */
window.TIDNINGAR = [
  { id: 'blt', namn: 'Blekinge Läns Tidning', undertitel: 'med Karlshamns Allehanda och Sölvesborgs-Tidningen', farg: '#37519a', webb: 'BLT.se', pris: 'Pris 39 kronor', bild: 'images/header.png' },
  { id: 'barometern', namn: 'Barometern', undertitel: 'med Oskarshamns-Tidningen', farg: null, webb: 'barometern.se', pris: null },
  { id: 'bt', namn: 'Borås Tidning', undertitel: null, farg: null, webb: null, pris: null },
  { id: 'klt', namn: 'Kalmar Läns Tidning', undertitel: 'med Nybro Tidning', farg: null, webb: null, pris: null },
  { id: 'kb', namn: 'Kristianstadsbladet', undertitel: null, farg: null, webb: null, pris: null },
  { id: 'nsk', namn: 'Norra Skåne', undertitel: null, farg: null, webb: 'nsk.se', pris: null },
  { id: 'skd', namn: 'Skånska Dagbladet', undertitel: null, farg: null, webb: null, pris: null },
  { id: 'smp', namn: 'Smålandsposten', undertitel: null, farg: null, webb: 'smp.se', pris: null },
  { id: 'sydostran', namn: 'Sydöstran', undertitel: null, farg: null, webb: 'sydostran.se', pris: null },
  { id: 'ta', namn: 'Trelleborgs Allehanda', undertitel: null, farg: null, webb: null, pris: null },
  { id: 'ut', namn: 'Ulricehamns Tidning', undertitel: null, farg: null, webb: null, pris: null },
  { id: 'vb', namn: 'Växjöbladet Kronobergaren', undertitel: null, farg: null, webb: null, pris: null },
  { id: 'ya', namn: 'Ystads Allehanda', undertitel: null, farg: null, webb: null, pris: null },
  { id: 'ob', namn: 'Ölandsbladet', undertitel: null, farg: null, webb: null, pris: null },
];
