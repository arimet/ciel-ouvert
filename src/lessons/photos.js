// Photos shown in the explanation panels, one per lesson step and per cloud, keyed by `photo` in the lessons
// and by cloud family in the sky texts. Wikimedia Commons, free licences; prepared by tools/prepare-photo.mjs.
const commons = file => `https://commons.wikimedia.org/wiki/File:${file}`
const photo = (key, alt, author, license, file) => [key, { src: `insets/${key}.webp`, alt, credit: { author, license, url: commons(file) } }]

export const PHOTOS = Object.fromEntries([
  photo('etages', 'Des cumulus bas et, bien au-dessus, des voiles fibreux de cirrus et de cirrostratus', 'W.carter', 'CC BY-SA 4.0', 'Cumulus_and_cirrostratus_over_G%C3%A5seberg.jpg'),
  photo('cumulus', 'Des cumulus séparés, au sommet en chou-fleur et à la base plate et plus sombre', 'Marcin Konsek', 'CC BY-SA 4.0', 'Krajobraz_Karakorum_(03).jpg'),
  photo('stratocumulus', 'Des stratocumulus : grosses masses arrondies, avec des parties sombres', 'W.carter', 'CC BY-SA 4.0', 'Stratocumulus_and_cirrostratus_over_G%C3%A5seberg.jpg'),
  photo('stratus', 'Une couche de stratus grise et basse qui cache le haut d’une colline', 'Raviasha', 'CC BY-SA 4.0', 'Clouds_in_Coorg.jpg'),
  photo('nimbostratus', 'Un nimbostratus : une couche grise épaisse qui couvre tout le ciel et cache le soleil', 'Ironpiping', 'CC BY 4.0', 'Nimbusstratus_over_Denmark.jpg'),
  photo('altocumulus', 'Un banc d’altocumulus en galets blancs et gris, ombrés', 'Kr-val', 'Domaine public', 'Altocumulus_se_2.jpg'),
  photo('altostratus', 'Le soleil vu comme à travers un verre dépoli derrière un voile d’altostratus', 'Famartin', 'CC BY-SA 4.0', '2017-06-22_16_57_51_Sun_shining_dimly_through_an_altostratus_cloud_layer_over_Ladybank_Lane_in_the_Chantilly_Highlands_section_of_Oak_Hill,_Fairfax_County,_Virginia.jpg'),
  photo('cirrostratus', 'Un halo de 22° autour du soleil dans un voile de cirrostratus', 'Mitchell Underwood', 'CC BY-SA 4.0', 'Solar_Halo_Feb_13_2021.jpg'),
  photo('clear', 'Un ciel bleu presque sans nuages', 'Camilleh9', 'CC BY-SA 4.0', 'Ciel_bleu_sur_Beaulieu.JPG'),
  photo('cirrus', 'Des cirrus en filaments blancs et soyeux dans le ciel bleu', 'James St. John', 'CC BY 2.0', 'Cirrus_clouds_(mid-afternoon,_8_August_2016)_(Yellowstone,_Wyoming,_USA)_(29888558640).jpg'),
  photo('cirrocumulus', 'Un cirrocumulus fait de tout petits grains et de rides, sans ombre', 'Speednat', 'CC BY-SA 4.0', 'Cirrocumulus_stratiformis_in_the_Utah_desert.jpg'),
  photo('cumulonimbus', 'Un cumulonimbus vu de loin : une tour immense dont le sommet s’étale en enclume', 'Jakub Hałun', 'CC BY-SA 4.0', '20200607_Chmura_cumulonimbus_incus_nad_Krakowem_1407_0252.jpg'),
  photo('gouttelettes', 'Un nuage d’averse isolé, des traînées de précipitations pendent sous sa base', 'Sally V', 'CC BY-SA 4.0', 'Cloud_taken_in_springtime.jpg'),
  photo('pluie', 'Une forte pluie sur une campagne, les collines s’effacent derrière le rideau de pluie', 'Sebastian Heider', 'CC BY 3.0', 'Heavy_Rain_(168803113).jpeg'),
  photo('neige', 'Une rue sous la neige qui tombe, voitures couvertes de neige', 'Miha Peče', 'CC BY-SA 4.0', 'Snowing_in_%C5%A0i%C5%A1ka.jpg'),
  photo('nuit-claire', 'Une campagne de Dordogne blanche de givre au matin, sous un ciel bleu', 'Père Igor', 'CC BY-SA 3.0', 'Excideuil_campagne.JPG'),
  photo('fog', 'Un brouillard de rayonnement couché au fond d’une vallée à l’aube', 'umbrellahead56', 'CC BY 2.0', 'Mist_in_the_valley_floor_Devil%27s_Bridge_(52129061952).jpg'),
  photo('thermique', 'Un champ labouré chauffé par le soleil d’été, de jeunes cumulus se forment au-dessus', 'Nicholas A. Tonelli', 'CC BY 2.0', 'Flickr_-_Nicholas_T_-_Big_Sky_(2).jpg'),
  photo('cumulus-naissant', 'Un petit cumulus isolé, à la base plate, dans un ciel bleu', 'W.carter', 'CC BY 4.0', 'Cute_summer_cloud_over_Tuntorp,_Brastad.jpg'),
  photo('congestus', 'Un cumulus bourgeonnant monte en tour, son sommet en chou-fleur', 'Jacek Halicki', 'CC BY-SA 4.0', '2016_Chmura_Cumulus_congestus_02.jpg'),
  photo('eclair-nuage', 'Un cumulonimbus de nuit éclairé de l’intérieur par les éclairs', 'Junyu-K', 'CC BY-SA 4.0', '20250520_%E8%98%AD%E9%99%BD%E5%B9%B3%E5%8E%9F%E7%9A%84%E7%A9%8D%E9%9B%A8%E9%9B%B2%E9%9B%B7%E6%9A%B4.jpg'),
  photo('foudre', 'Un éclair frappe le sol sous un nuage d’orage', 'The Modern Polymath', 'CC BY 4.0', 'Cloud-to-ground_lightning_strike.jpg'),
  photo('grele', 'Un gros grêlon tenu en main, ses couches de glace visibles par transparence', 'NOAA', 'Domaine public', 'Nssl0098_-_Flickr_-_NOAA_Photo_Library.jpg'),
  photo('tornade', 'Une tornade relie la base du nuage d’orage au sol, dans la plaine du Kansas', 'Sean Waugh, NOAA/NSSL', 'Domaine public', 'Tornado_over_the_Kansas_plains_(Nssl0232_-_Flickr_-_NOAA_Photo_Library).jpg'),
  photo('cisaillement', 'Des nuages de Kelvin-Helmholtz : un vent plus rapide au-dessus enroule le haut de la couche en vagues', 'N O E L | F E A N S', 'CC BY 2.0', 'Nubes_de_Kelvin-Helmholtz_Kelvin-Helmholtz_Clouds_(40846169194).jpg'),
  photo('supercellule', 'Une supercellule en forme de soucoupe, striée par sa rotation', 'Máximo Matassa', 'CC BY-SA 4.0', 'Supercelda_en_Varela,_San_Luis.jpg'),
  photo('entonnoir', 'Un entonnoir descend de la base du nuage sans toucher encore le sol', 'Justin Hobson', 'CC BY 2.5', 'F5_tornado_funnel_cloud_Elie_Manitoba_2007.jpg'),
  photo('tornade-france', 'La tornade de Sonnac, en Charente-Maritime, le 16 septembre 2015', 'Axel Guibourg', 'CC BY-SA 4.0', 'Tornade_Sonnac.jpg'),
])
