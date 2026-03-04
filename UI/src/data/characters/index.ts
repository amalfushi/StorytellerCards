import type { CharacterDef } from '@/types/index.ts';

// ── Townsfolk ──
import { acrobat } from './townsfolk/acrobat.ts';
import { alchemist } from './townsfolk/alchemist.ts';
import { alsaahir } from './townsfolk/alsaahir.ts';
import { amnesiac } from './townsfolk/amnesiac.ts';
import { artist } from './townsfolk/artist.ts';
import { atheist } from './townsfolk/atheist.ts';
import { balloonist } from './townsfolk/balloonist.ts';
import { banshee } from './townsfolk/banshee.ts';
import { bountyhunter } from './townsfolk/bountyhunter.ts';
import { cannibal } from './townsfolk/cannibal.ts';
import { chambermaid } from './townsfolk/chambermaid.ts';
import { chef } from './townsfolk/chef.ts';
import { choirboy } from './townsfolk/choirboy.ts';
import { clockmaker } from './townsfolk/clockmaker.ts';
import { courtier } from './townsfolk/courtier.ts';
import { cultleader } from './townsfolk/cultleader.ts';
import { dreamer } from './townsfolk/dreamer.ts';
import { empath } from './townsfolk/empath.ts';
import { engineer } from './townsfolk/engineer.ts';
import { exorcist } from './townsfolk/exorcist.ts';
import { farmer } from './townsfolk/farmer.ts';
import { fisherman } from './townsfolk/fisherman.ts';
import { flowergirl } from './townsfolk/flowergirl.ts';
import { fool } from './townsfolk/fool.ts';
import { fortuneteller } from './townsfolk/fortuneteller.ts';
import { gambler } from './townsfolk/gambler.ts';
import { general } from './townsfolk/general.ts';
import { gossip } from './townsfolk/gossip.ts';
import { grandmother } from './townsfolk/grandmother.ts';
import { highpriestess } from './townsfolk/highpriestess.ts';
import { huntsman } from './townsfolk/huntsman.ts';
import { innkeeper } from './townsfolk/innkeeper.ts';
import { investigator } from './townsfolk/investigator.ts';
import { juggler } from './townsfolk/juggler.ts';
import { king } from './townsfolk/king.ts';
import { knight } from './townsfolk/knight.ts';
import { librarian } from './townsfolk/librarian.ts';
import { lycanthrope } from './townsfolk/lycanthrope.ts';
import { magician } from './townsfolk/magician.ts';
import { mathematician } from './townsfolk/mathematician.ts';
import { mayor } from './townsfolk/mayor.ts';
import { minstrel } from './townsfolk/minstrel.ts';
import { monk } from './townsfolk/monk.ts';
import { nightwatchman } from './townsfolk/nightwatchman.ts';
import { noble } from './townsfolk/noble.ts';
import { oracle } from './townsfolk/oracle.ts';
import { pacifist } from './townsfolk/pacifist.ts';
import { philosopher } from './townsfolk/philosopher.ts';
import { pixie } from './townsfolk/pixie.ts';
import { poppygrower } from './townsfolk/poppygrower.ts';
import { preacher } from './townsfolk/preacher.ts';
import { princess } from './townsfolk/princess.ts';
import { professor } from './townsfolk/professor.ts';
import { ravenkeeper } from './townsfolk/ravenkeeper.ts';
import { sage } from './townsfolk/sage.ts';
import { sailor } from './townsfolk/sailor.ts';
import { savant } from './townsfolk/savant.ts';
import { seamstress } from './townsfolk/seamstress.ts';
import { shugenja } from './townsfolk/shugenja.ts';
import { slayer } from './townsfolk/slayer.ts';
import { snakecharmer } from './townsfolk/snakecharmer.ts';
import { soldier } from './townsfolk/soldier.ts';
import { steward } from './townsfolk/steward.ts';
import { tealady } from './townsfolk/tealady.ts';
import { towncrier } from './townsfolk/towncrier.ts';
import { undertaker } from './townsfolk/undertaker.ts';
import { villageidiot } from './townsfolk/villageidiot.ts';
import { virgin } from './townsfolk/virgin.ts';
import { washerwoman } from './townsfolk/washerwoman.ts';

// ── Outsiders ──
import { barber } from './outsider/barber.ts';
import { butler } from './outsider/butler.ts';
import { damsel } from './outsider/damsel.ts';
import { drunk } from './outsider/drunk.ts';
import { golem } from './outsider/golem.ts';
import { goon } from './outsider/goon.ts';
import { hatter } from './outsider/hatter.ts';
import { heretic } from './outsider/heretic.ts';
import { hermit } from './outsider/hermit.ts';
import { klutz } from './outsider/klutz.ts';
import { lunatic } from './outsider/lunatic.ts';
import { moonchild } from './outsider/moonchild.ts';
import { mutant } from './outsider/mutant.ts';
import { ogre } from './outsider/ogre.ts';
import { plaguedoctor } from './outsider/plaguedoctor.ts';
import { politician } from './outsider/politician.ts';
import { puzzlemaster } from './outsider/puzzlemaster.ts';
import { recluse } from './outsider/recluse.ts';
import { saint } from './outsider/saint.ts';
import { snitch } from './outsider/snitch.ts';
import { sweetheart } from './outsider/sweetheart.ts';
import { tinker } from './outsider/tinker.ts';
import { zealot } from './outsider/zealot.ts';

// ── Minions ──
import { assassin } from './minion/assassin.ts';
import { baron } from './minion/baron.ts';
import { boffin } from './minion/boffin.ts';
import { boomdandy } from './minion/boomdandy.ts';
import { cerenovus } from './minion/cerenovus.ts';
import { devilsadvocate } from './minion/devilsadvocate.ts';
import { eviltwin } from './minion/eviltwin.ts';
import { fearmonger } from './minion/fearmonger.ts';
import { goblin } from './minion/goblin.ts';
import { godfather } from './minion/godfather.ts';
import { harpy } from './minion/harpy.ts';
import { marionette } from './minion/marionette.ts';
import { mastermind } from './minion/mastermind.ts';
import { mezepheles } from './minion/mezepheles.ts';
import { organgrinder } from './minion/organgrinder.ts';
import { pithag } from './minion/pithag.ts';
import { poisoner } from './minion/poisoner.ts';
import { psychopath } from './minion/psychopath.ts';
import { scarletwoman } from './minion/scarletwoman.ts';
import { spy } from './minion/spy.ts';
import { summoner } from './minion/summoner.ts';
import { vizier } from './minion/vizier.ts';
import { widow } from './minion/widow.ts';
import { witch } from './minion/witch.ts';
import { wizard } from './minion/wizard.ts';
import { wraith } from './minion/wraith.ts';
import { xaan } from './minion/xaan.ts';

// ── Demons ──
import { alhadikhia } from './demon/alhadikhia.ts';
import { fanggu } from './demon/fanggu.ts';
import { imp } from './demon/imp.ts';
import { kazali } from './demon/kazali.ts';
import { legion } from './demon/legion.ts';
import { leviathan } from './demon/leviathan.ts';
import { lilmonsta } from './demon/lilmonsta.ts';
import { lleech } from './demon/lleech.ts';
import { lordoftyphon } from './demon/lordoftyphon.ts';
import { nodashii } from './demon/nodashii.ts';
import { ojo } from './demon/ojo.ts';
import { po } from './demon/po.ts';
import { pukka } from './demon/pukka.ts';
import { riot } from './demon/riot.ts';
import { shabaloth } from './demon/shabaloth.ts';
import { vigormortis } from './demon/vigormortis.ts';
import { vortox } from './demon/vortox.ts';
import { yaggababble } from './demon/yaggababble.ts';
import { zombuul } from './demon/zombuul.ts';

// ── Fabled ──
import { angel } from './fabled/angel.ts';
import { buddhist } from './fabled/buddhist.ts';
import { deusexfiasco } from './fabled/deusexfiasco.ts';
import { djinn } from './fabled/djinn.ts';
import { doomsayer } from './fabled/doomsayer.ts';
import { duchess } from './fabled/duchess.ts';
import { ferryman } from './fabled/ferryman.ts';
import { fibbin } from './fabled/fibbin.ts';
import { fiddler } from './fabled/fiddler.ts';
import { hellslibrarian } from './fabled/hellslibrarian.ts';
import { revolutionary } from './fabled/revolutionary.ts';
import { sentinel } from './fabled/sentinel.ts';
import { spiritofivory } from './fabled/spiritofivory.ts';
import { toymaker } from './fabled/toymaker.ts';

// ── Travellers ──
import { apprentice } from './traveller/apprentice.ts';
import { barista } from './traveller/barista.ts';
import { beggar } from './traveller/beggar.ts';
import { bishop } from './traveller/bishop.ts';
import { bonecollector } from './traveller/bonecollector.ts';
import { bureaucrat } from './traveller/bureaucrat.ts';
import { butcher } from './traveller/butcher.ts';
import { cacklejack } from './traveller/cacklejack.ts';
import { deviant } from './traveller/deviant.ts';
import { gangster } from './traveller/gangster.ts';
import { gnome } from './traveller/gnome.ts';
import { gunslinger } from './traveller/gunslinger.ts';
import { harlot } from './traveller/harlot.ts';
import { judge } from './traveller/judge.ts';
import { matron } from './traveller/matron.ts';
import { scapegoat } from './traveller/scapegoat.ts';
import { thief } from './traveller/thief.ts';
import { voudon } from './traveller/voudon.ts';

// ── Loric ──
import { bigwig } from './loric/bigwig.ts';
import { bootlegger } from './loric/bootlegger.ts';
import { gardener } from './loric/gardener.ts';
import { hindu } from './loric/hindu.ts';
import { pope } from './loric/pope.ts';
import { stormcatcher } from './loric/stormcatcher.ts';
import { tor } from './loric/tor.ts';
import { ventriloquist } from './loric/ventriloquist.ts';
import { zenomancer } from './loric/zenomancer.ts';

/** All character definitions. */
export const allCharacters: CharacterDef[] = [
  // Townsfolk
  acrobat,
  alchemist,
  alsaahir,
  amnesiac,
  artist,
  atheist,
  balloonist,
  banshee,
  bountyhunter,
  cannibal,
  chambermaid,
  chef,
  choirboy,
  clockmaker,
  courtier,
  cultleader,
  dreamer,
  empath,
  engineer,
  exorcist,
  farmer,
  fisherman,
  flowergirl,
  fool,
  fortuneteller,
  gambler,
  general,
  gossip,
  grandmother,
  highpriestess,
  huntsman,
  innkeeper,
  investigator,
  juggler,
  king,
  knight,
  librarian,
  lycanthrope,
  magician,
  mathematician,
  mayor,
  minstrel,
  monk,
  nightwatchman,
  noble,
  oracle,
  pacifist,
  philosopher,
  pixie,
  poppygrower,
  preacher,
  princess,
  professor,
  ravenkeeper,
  sage,
  sailor,
  savant,
  seamstress,
  shugenja,
  slayer,
  snakecharmer,
  soldier,
  steward,
  tealady,
  towncrier,
  undertaker,
  villageidiot,
  virgin,
  washerwoman,
  // Outsiders
  barber,
  butler,
  damsel,
  drunk,
  golem,
  goon,
  hatter,
  heretic,
  hermit,
  klutz,
  lunatic,
  moonchild,
  mutant,
  ogre,
  plaguedoctor,
  politician,
  puzzlemaster,
  recluse,
  saint,
  snitch,
  sweetheart,
  tinker,
  zealot,
  // Minions
  assassin,
  baron,
  boffin,
  boomdandy,
  cerenovus,
  devilsadvocate,
  eviltwin,
  fearmonger,
  goblin,
  godfather,
  harpy,
  marionette,
  mastermind,
  mezepheles,
  organgrinder,
  pithag,
  poisoner,
  psychopath,
  scarletwoman,
  spy,
  summoner,
  vizier,
  widow,
  witch,
  wizard,
  wraith,
  xaan,
  // Demons
  alhadikhia,
  fanggu,
  imp,
  kazali,
  legion,
  leviathan,
  lilmonsta,
  lleech,
  lordoftyphon,
  nodashii,
  ojo,
  po,
  pukka,
  riot,
  shabaloth,
  vigormortis,
  vortox,
  yaggababble,
  zombuul,
  // Fabled
  angel,
  buddhist,
  deusexfiasco,
  djinn,
  doomsayer,
  duchess,
  ferryman,
  fibbin,
  fiddler,
  hellslibrarian,
  revolutionary,
  sentinel,
  spiritofivory,
  toymaker,
  // Travellers
  apprentice,
  barista,
  beggar,
  bishop,
  bonecollector,
  bureaucrat,
  butcher,
  cacklejack,
  deviant,
  gangster,
  gnome,
  gunslinger,
  harlot,
  judge,
  matron,
  scapegoat,
  thief,
  voudon,
  // Loric
  bigwig,
  bootlegger,
  gardener,
  hindu,
  pope,
  stormcatcher,
  tor,
  ventriloquist,
  zenomancer,
];

/** Fast lookup map: character ID → CharacterDef. */
export const characterMap: Map<string, CharacterDef> = new Map(allCharacters.map((c) => [c.id, c]));

/**
 * Get a character definition by ID.
 * Returns `undefined` if not found (caller should use getFallbackCharacter for unknowns).
 */
export function getCharacter(id: string): CharacterDef | undefined {
  return characterMap.get(id);
}

export { buildNightOrder, FIRST_NIGHT_STRUCTURAL, OTHER_NIGHTS_STRUCTURAL } from './_nightOrder.ts';
