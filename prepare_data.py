import json
import math

with open("nasa_systems.json", "r", encoding="utf-8") as f:
    nasa_systems = json.load(f)

print(f"Loaded {len(nasa_systems)} systems from nasa_systems.json")

def get_constellation(ra_deg, dec_deg):
    if ra_deg is None or dec_deg is None:
        return "Desconocida"
    ra_h = ra_deg / 15.0
    
    if 18.5 <= ra_h <= 21.0 and 27 <= dec_deg <= 53: return "Cisne (Cygnus)"
    if 18.0 <= ra_h <= 19.5 and 25 <= dec_deg <= 45: return "Lira (Lyra)"
    if 13.0 <= ra_h <= 15.0 and -70 <= dec_deg <= -30: return "Centauro (Centaurus)"
    if 21.0 <= ra_h <= 23.5 and -25 <= dec_deg <= 5: return "Acuario (Aquarius)"
    if 8.0 <= ra_h <= 9.5 and 5 <= dec_deg <= 35: return "Cáncer (Cancer)"
    if 5.0 <= ra_h <= 6.5 and -10 <= dec_deg <= 25: return "Orión (Orion)"
    if 11.0 <= ra_h <= 14.0 and 30 <= dec_deg <= 70: return "Osa Mayor (Ursa Major)"
    if 0.0 <= ra_h <= 2.0 and 20 <= dec_deg <= 50: return "Andrómeda (Andromeda)"
    if 2.0 <= ra_h <= 4.0 and 30 <= dec_deg <= 60: return "Perseo (Perseus)"
    if 15.5 <= ra_h <= 18.0 and -45 <= dec_deg <= -10: return "Escorpio (Scorpius)"
    if 17.5 <= ra_h <= 20.5 and -45 <= dec_deg <= -10: return "Sagitario (Sagittarius)"
    if 10.0 <= ra_h <= 12.5 and -5 <= dec_deg <= 25: return "Leo (Leo)"
    if 12.0 <= ra_h <= 15.0 and -25 <= dec_deg <= 10: return "Virgo (Virgo)"
    if 3.5 <= ra_h <= 5.5 and 0 <= dec_deg <= 30: return "Tauro (Taurus)"
    if 0.5 <= ra_h <= 2.5 and -40 <= dec_deg <= 0: return "Ballena (Cetus)"
    if 19.0 <= ra_h <= 21.0 and -10 <= dec_deg <= 20: return "Águila (Aquila)"
    if 5.5 <= ra_h <= 8.0 and 10 <= dec_deg <= 40: return "Géminis (Gemini)"
    if 6.0 <= ra_h <= 8.0 and -35 <= dec_deg <= -10: return "Can Mayor (Canis Major)"
    if 23.0 <= ra_h <= 24.0 and 40 <= dec_deg <= 70: return "Casiopea (Cassiopeia)"
    if dec_deg >= 65: return "Cefeo / Osa Menor"
    if dec_deg <= -60: return "Carina / Cruz del Sur"
    return "Zona Ecuatorial / Profunda"

def calculate_accurate_hz(st_teff, st_rad):
    if not st_teff or st_teff <= 0: st_teff = 5778.0
    if not st_rad or st_rad <= 0: st_rad = 1.0
    
    lum = (st_rad ** 2) * ((st_teff / 5778.0) ** 4)
    t_diff = st_teff - 5780.0
    
    seff_in_cons = 1.0146 + 8.1774e-5 * t_diff + 1.7063e-9 * (t_diff**2)
    seff_out_cons = 0.3507 + 5.8942e-5 * t_diff + 1.6558e-9 * (t_diff**2)
    
    seff_in_opt = 1.7763 + 1.4335e-4 * t_diff
    seff_out_opt = 0.3207 + 5.5471e-5 * t_diff
    
    seff_in_cons = max(0.65, min(2.5, seff_in_cons))
    seff_out_cons = max(0.20, min(0.6, seff_out_cons))
    seff_in_opt = max(0.9, min(3.0, seff_in_opt))
    seff_out_opt = max(0.18, min(0.5, seff_out_opt))
    
    hz_in = round(math.sqrt(lum / seff_in_opt), 4)
    hz_out = round(math.sqrt(lum / seff_out_opt), 4)
    hz_in_c = round(math.sqrt(lum / seff_in_cons), 4)
    hz_out_c = round(math.sqrt(lum / seff_out_cons), 4)
    
    hz_in = max(0.005, hz_in)
    hz_out = max(hz_in + 0.005, hz_out)
    
    return hz_in, hz_out, hz_in_c, hz_out_c, lum

def calculate_planet_teq(st_teff, st_rad, semi_major_au, current_teq=None):
    if current_teq is not None and current_teq > 0:
        return int(round(current_teq))
    if not st_teff or st_teff <= 0: st_teff = 5778.0
    if not st_rad or st_rad <= 0: st_rad = 1.0
    if not semi_major_au or semi_major_au <= 0: semi_major_au = 0.5
    
    teq = st_teff * math.sqrt(st_rad / semi_major_au) * 0.04822 * ((1.0 - 0.25) ** 0.25)
    return int(round(max(10, min(6000, teq))))

def estimate_planet_mass(radius_earth, current_mass=None):
    if current_mass is not None and current_mass > 0:
        return round(current_mass, 2)
    if not radius_earth or radius_earth <= 0:
        return 1.0
    r = radius_earth
    if r < 1.23:
        m = r ** 3.0
    elif r < 2.0:
        m = 2.69 * (r ** 0.93)
    elif r < 4.0:
        m = 1.4 * (r ** 2.06)
    elif r < 12.0:
        m = 0.8 * (r ** 2.3)
    else:
        m = 300.0
    return round(m, 2)

def estimate_surface_gravity(mass_earth, radius_earth):
    if not mass_earth or not radius_earth or radius_earth <= 0:
        return 1.0
    g = mass_earth / (radius_earth ** 2)
    return round(g, 2)

CURATED_SYSTEM_DESCRIPTIONS = {
    "Sistema Solar": "Nuestro hogar cósmico. Origen [0,0,0] del sistema de coordenadas celestes geocéntrico. Alberga 8 planetas principales, más de 200 lunas y el único mundo conocido con vida biológica activa.",
    "TRAPPIST-1": "Sistema exoplanetario legendario a 39.5 años luz en Acuario. Posee 7 planetas rocosos de tamaño terrestre orbitando una enana roja ultrafría. Cuatro de ellos (d, e, f, g) residen en la zona habitable, convirtiéndolo en el principal objetivo del telescopio James Webb.",
    "Proxima Centauri": "La estrella más cercana al Sistema Solar, a solo 4.246 años luz en Centauro. Alberga a Próxima b, un mundo rocoso templado en la zona habitable que soporta intensas llamaradas estelares de su enana roja.",
    "Kepler-16": "El icónico sistema circumbinario 'Tatooine' a 245 años luz en Cygnus. Kepler-16b orbita alrededor de dos estrellas a la vez (una enana K y una enana M), presenciando atardeceres dobles en cada jornada.",
    "Kepler-47": "El primer sistema circumbinario multiplanetario confirmado por la NASA, con tres planetas orbitando un par binario de estrellas a 3.400 años luz en la constelación del Cisne.",
    "Kepler-90": "El primer sistema estelar conocido con tantos planetas como nuestro Sistema Solar (8 mundos confirmados). Sus planetas orbitan muy apretados alrededor de una estrella similar al Sol en Draco.",
    "Kepler-452": "Famoso por Kepler-452b ('Tierra 2.0'), una super-Tierra a 1.400 años luz con un período orbital de 385 días alrededor de una estrella gemela solar G2V, prácticamente idéntica al Sol.",
    "Kepler-186": "Hogar de Kepler-186f, el primer planeta del tamaño de la Tierra jamás descubierto dentro de la zona habitable de otra estrella, ubicado a 580 años luz en Cygnus.",
    "55 Cnc": "Sistema binario en Cáncer que contiene a 55 Cancri e (Janssen), una super-Tierra ultracaliente de período de 18 horas con océanos de lava hirviente a más de 2.000 °C.",
    "Kepler-22": "Estrella solar tipo G a 620 años luz que hospeda a Kepler-22b, el primer exoplaneta de Kepler confirmado en órbita habitable, posiblemente un mundo océano de agua líquida.",
    "TOI-700": "Enana roja tranquila a 101 años luz en Dorado que alberga a TOI-700 d y TOI-700 e, dos mundos de tamaño terrestre en la zona habitable sin llamaradas estelares violentas.",
    "LHS 1140": "Enana roja serena a 48 años luz en Cetus. Su planeta LHS 1140 b es una super-Tierra rocosa excepcionalmente densa y con alta probabilidad de retener atmósfera y un océano templado.",
    "WASP-12": "Hospeda a WASP-12b, un gigante gaseoso ultracaliente a 2.600 K tan cercano a su estrella que las fuerzas de marea lo están deformando en un esferoide elíptico y evaporando su atmósfera.",
    "WASP-76": "Gigante gaseoso ultracaliente a 640 años luz donde las temperaturas en su cara diurna superan los 2.400 °C, provocando que el hierro se vaporice y llueva en forma líquida en la noche."
}

CURATED_PLANET_DESCRIPTIONS = {
    "TRAPPIST-1 e": "Candidato número 1 de habitabilidad en TRAPPIST-1. Es un mundo rocoso con 0.92 veces el radio de la Tierra y un 93% de su densidad. Recibe un 66% de la radiación solar terrestre, ideal para agua líquida y atmósfera estable.",
    "TRAPPIST-1 d": "Ubicado en el borde interior templado de la zona habitable (286 K / +13 °C). Posee una masa de 0.38 Tierras y podría poseer una atmósfera húmeda con océanos superficiales.",
    "TRAPPIST-1 f": "Planeta templado-frío en la zona habitable (218 K / -55 °C). Su densidad sugiere que podría ser un mundo oceánico con una capa masiva de hielo y agua líquida subglacial.",
    "TRAPPIST-1 g": "El mayor de los planetas habitables de TRAPPIST-1 (1.13 R⊕). A 197 K (-76 °C), se encuentra en el límite exterior habitable, similar a un Marte supermasivo con potencial efecto invernadero.",
    "TRAPPIST-1 b": "El planeta más interno. Rocoso pero abrasador (398 K / +125 °C), bajo una intensa marea gravitatoria que provoca vulcanismo y pérdida de atmósfera primaria.",
    "TRAPPIST-1 c": "Mundo rocoso ultradense caliente (340 K / +67 °C). Las observaciones del telescopio Webb descartan una atmósfera espesa de hidrógeno, sugiriendo superficie desnuda o fina capa de CO2.",
    "TRAPPIST-1 h": "El mundo más lejano y gélido del sistema (172 K / -101 °C). Planeta enano de hielo similar a las lunas jovianas con órbita resonante de 18.8 días.",
    "Proxima Centauri b": "El exoplaneta más cercano a la Tierra (4.25 AL). Masa mínima de 1.17 M⊕ y órbita de 11.2 días en la zona habitable (234 K / -39 °C). Podría albergar agua si resiste el viento estelar.",
    "Kepler-452 b": "La célebre 'Tierra 2.0'. Super-Tierra con radio de 1.63 R⊕ en órbita de 385 días en plena zona habitable (265 K / -8 °C) alrededor de una estrella gemela solar idéntica al Sol.",
    "Kepler-186 f": "Hito histórico de la astronomía: primer planeta de tamaño terrestre (1.17 R⊕) confirmado en la zona habitable de otra estrella. Temperatura de equilibrio de 177 K (-96 °C).",
    "55 Cnc e": "Mundo infernal ultradenso con océano de magma a más de 1.950 K (+1.680 °C). Orbita a solo 0.015 UA de su estrella cada 18 horas; el Webb ha detectado indicios de atmósfera secundaria de monóxido de carbono.",
    "Kepler-22 b": "Primer planeta de Kepler en zona habitable solar. Con 2.4 veces el radio terrestre, es el prototipo de 'mundo de agua' o sub-Neptuno templado con nubes y posible océano global.",
    "TOI-700 d": "Mundo rocoso del tamaño de la Tierra (1.14 R⊕) a 101 años luz. Recibe el 86% de la energía de la Tierra, situándolo en el corazón de la zona habitable con 269 K (-4 °C).",
    "TOI-700 e": "Descubierto en 2023 por TESS entre los planetas c y d. Tamaño terrestre (0.95 R⊕) en la zona habitable optimista a 273 K (0 °C), completando 2 mundos habitables en el sistema.",
    "LHS 1140 b": "Super-Tierra rocosa densa a 48 AL con 1.7 R⊕ y 5.6 M⊕ en la zona habitable (226 K / -47 °C). Considerada por los astrobiólogos como uno de los objetivos más estables para buscar biofirmas.",
    "WASP-12 b": "Júpiter ultracaliente a 2.600 K (+2.327 °C) en caída espiral hacia su estrella. Deformado como un balón de rugby por la gravedad estelar mientras pierde 200 millones de toneladas de masa por segundo.",
    "WASP-76 b": "Mundo gigante de temperaturas brutales (2.228 K). El calor extremo descompone el hierro en la atmósfera diurna, que es transportado por vientos de 18.000 km/h y se condensa en lluvia metálica nocturna."
}

solar_system = {
    "name": "Sistema Solar",
    "starsCount": 1,
    "planetsCount": 8,
    "distanceLy": 0.0,
    "distancePc": 0.0,
    "raDeg": 0.0,
    "decDeg": 0.0,
    "raHms": "00h 00m 00s (Punto Cero)",
    "decDms": "+00° 00' 00\"",
    "constellation": "Vía Láctea (Local)",
    "coordsEarth": { "x": 0.0, "y": 0.0, "z": 0.0 },
    "starTeff": 5778,
    "starRadius": 1.0,
    "starMass": 1.0,
    "starSpecType": "G2V",
    "hzInner": 0.95,
    "hzOuter": 1.67,
    "customDesc": CURATED_SYSTEM_DESCRIPTIONS["Sistema Solar"],
    "planets": [
        {
            "name": "Mercurio",
            "radiusEarth": 0.383,
            "massEarth": 0.055,
            "surfaceGravityG": 0.38,
            "orbitalPeriodDays": 87.97,
            "semiMajorAxisAu": 0.387,
            "eqTempK": 440,
            "eqTempC": 166.9,
            "discoveryMethod": "Antigüedad",
            "discoveryYear": "Antigüedad",
            "type": "Terrestre / Rocoso",
            "inHabitableZone": False,
            "color": "#9ca3af",
            "customDesc": "El planeta más cercano al Sol. Es un mundo rocoso densamente craterizado, sin atmósfera apreciable y con oscilaciones térmicas extremas (-180°C de noche a +430°C de día)."
        },
        {
            "name": "Venus",
            "radiusEarth": 0.949,
            "massEarth": 0.815,
            "surfaceGravityG": 0.90,
            "orbitalPeriodDays": 224.7,
            "semiMajorAxisAu": 0.723,
            "eqTempK": 737,
            "eqTempC": 463.9,
            "discoveryMethod": "Antigüedad",
            "discoveryYear": "Antigüedad",
            "type": "Terrestre / Rocoso",
            "inHabitableZone": False,
            "color": "#fde047",
            "customDesc": "Hermano infernal de la Tierra. Sufre un efecto invernadero descontrolado bajo una densa atmósfera de CO2 y nubes de ácido sulfúrico con presiones de 92 atmósferas y 464°C superficiales."
        },
        {
            "name": "Tierra",
            "radiusEarth": 1.0,
            "massEarth": 1.0,
            "surfaceGravityG": 1.0,
            "orbitalPeriodDays": 365.25,
            "semiMajorAxisAu": 1.0,
            "eqTempK": 288,
            "eqTempC": 14.9,
            "discoveryMethod": "Planeta Hogar (Origen 0,0,0)",
            "discoveryYear": "—",
            "type": "Terrestre / Rocoso",
            "inHabitableZone": True,
            "color": "#38bdf8",
            "customDesc": "Punto de origen de todas las observaciones astronómicas terrestres. El único mundo conocido con vida biológica y agua líquida superficial abundante gracias a su escudo magnético y atmósfera equilibrada."
        },
        {
            "name": "Marte",
            "radiusEarth": 0.532,
            "massEarth": 0.107,
            "surfaceGravityG": 0.38,
            "orbitalPeriodDays": 686.98,
            "semiMajorAxisAu": 1.524,
            "eqTempK": 210,
            "eqTempC": -63.1,
            "discoveryMethod": "Antigüedad",
            "discoveryYear": "Antigüedad",
            "type": "Terrestre / Rocoso",
            "inHabitableZone": True,
            "color": "#ea580c",
            "customDesc": "El 'Planeta Rojo', desértico y frío con óxido de hierro en su regolito. En su juventud hace 3.800 millones de años albergó ríos, lagos y mares de agua líquida."
        },
        {
            "name": "Júpiter",
            "radiusEarth": 11.21,
            "massEarth": 317.8,
            "surfaceGravityG": 2.53,
            "orbitalPeriodDays": 4332.59,
            "semiMajorAxisAu": 5.204,
            "eqTempK": 165,
            "eqTempC": -108.1,
            "discoveryMethod": "Antigüedad",
            "discoveryYear": "Antigüedad",
            "type": "Gigante Gaseoso",
            "inHabitableZone": False,
            "color": "#d97706",
            "customDesc": "El coloso del Sistema Solar, con más del doble de masa que todos los demás planetas juntos. Compuesto de hidrógeno y helio con su icónica Gran Mancha Roja y 95 lunas confirmadas."
        },
        {
            "name": "Saturno",
            "radiusEarth": 9.45,
            "massEarth": 95.2,
            "surfaceGravityG": 1.07,
            "orbitalPeriodDays": 10759.22,
            "semiMajorAxisAu": 9.582,
            "eqTempK": 134,
            "eqTempC": -139.1,
            "discoveryMethod": "Antigüedad",
            "discoveryYear": "Antigüedad",
            "type": "Gigante Gaseoso",
            "inHabitableZone": False,
            "hasRings": True,
            "color": "#fef08a",
            "customDesc": "Famoso por su majestuoso sistema de anillos compuestos de billones de fragmentos de hielo puro y roca orbitando a gran velocidad en una lámina de solo decenas de metros de espesor."
        },
        {
            "name": "Urano",
            "radiusEarth": 4.01,
            "massEarth": 14.5,
            "surfaceGravityG": 0.89,
            "orbitalPeriodDays": 30685.4,
            "semiMajorAxisAu": 19.2,
            "eqTempK": 76,
            "eqTempC": -197.1,
            "discoveryMethod": "Telescopio",
            "discoveryYear": 1781,
            "type": "Sub-Neptuno / Neptuniano",
            "inHabitableZone": False,
            "color": "#67e8f9",
            "customDesc": "Gigante de hielo con una inclinación axial extrema de 97.8° (gira de costado). Su atmósfera de hidrógeno, helio y metano le confiere un color aguamarina pálido."
        },
        {
            "name": "Neptuno",
            "radiusEarth": 3.88,
            "massEarth": 17.1,
            "surfaceGravityG": 1.14,
            "orbitalPeriodDays": 60189.0,
            "semiMajorAxisAu": 30.05,
            "eqTempK": 72,
            "eqTempC": -201.1,
            "discoveryMethod": "Matemático",
            "discoveryYear": 1846,
            "type": "Sub-Neptuno / Neptuniano",
            "inHabitableZone": False,
            "color": "#3b82f6",
            "customDesc": "El planeta más distante del Sol. Un mundo azotado por vientos huracanados supersónicos de más de 2.100 km/h y tormentas activas impulsadas por calor interno residual."
        }
    ]
}

updated_systems = []
for sys_item in nasa_systems:
    name = sys_item.get("name", "")
    st_teff = sys_item.get("starTeff") or 5778.0
    st_rad = sys_item.get("starRadius") or 1.0
    st_mass = sys_item.get("starMass") or 1.0
    
    hz_in, hz_out, hz_in_c, hz_out_c, lum = calculate_accurate_hz(st_teff, st_rad)
    sys_item["hzInner"] = hz_in
    sys_item["hzOuter"] = hz_out
    sys_item["hzInnerCons"] = hz_in_c
    sys_item["hzOuterCons"] = hz_out_c
    sys_item["starLumSolar"] = round(lum, 4)
    sys_item["constellation"] = get_constellation(sys_item.get("raDeg"), sys_item.get("decDeg"))
    
    if name in CURATED_SYSTEM_DESCRIPTIONS:
        sys_item["customDesc"] = CURATED_SYSTEM_DESCRIPTIONS[name]
    
    planets = sys_item.get("planets", [])
    for p in planets:
        p_name = p.get("name", "")
        semi_au = p.get("semiMajorAxisAu")
        if not semi_au or semi_au <= 0:
            orb_per = p.get("orbitalPeriodDays") or 10.0
            semi_au = round(((orb_per / 365.25) ** (2/3)) * (st_mass ** (1/3)), 4)
            p["semiMajorAxisAu"] = semi_au
        
        orig_teq = p.get("eqTempK")
        new_teq = calculate_planet_teq(st_teff, st_rad, semi_au, orig_teq)
        p["eqTempK"] = new_teq
        p["eqTempC"] = round(new_teq - 273.15, 1)
        
        p["inHabitableZone"] = (hz_in <= semi_au <= hz_out)
        p["inConservativeHZ"] = (hz_in_c <= semi_au <= hz_out_c)
        
        rad_e = p.get("radiusEarth") or 1.0
        mass_e = estimate_planet_mass(rad_e, p.get("massEarth"))
        p["massEarth"] = mass_e
        p["surfaceGravityG"] = estimate_surface_gravity(mass_e, rad_e)
        
        if p_name in CURATED_PLANET_DESCRIPTIONS:
            p["customDesc"] = CURATED_PLANET_DESCRIPTIONS[p_name]
    
    planets.sort(key=lambda pl: pl.get("semiMajorAxisAu", 0))
    sys_item["planets"] = planets
    updated_systems.append(sys_item)

all_systems = [solar_system] + updated_systems

FAMOUS_SORT_ORDER = [
    "Sistema Solar", "TRAPPIST-1", "Proxima Centauri", "Kepler-16", "Kepler-452", 
    "Kepler-186", "Kepler-22", "TOI-700", "LHS 1140", "Kepler-47", "Kepler-90", 
    "55 Cnc", "K2-18", "WASP-12", "WASP-76", "WASP-121", "HD 209458", "HD 189733", "HR 8799"
]

def sort_key(s):
    name = s.get("name", "")
    if name in FAMOUS_SORT_ORDER:
        return (-100 + FAMOUS_SORT_ORDER.index(name), 0)
    p_cnt = s.get("planetsCount") or len(s.get("planets", []))
    dist = s.get("distanceLy") or 99999
    return (-p_cnt, dist)

all_systems.sort(key=sort_key)

with open("systems_data.js", "w", encoding="utf-8") as f:
    f.write("// NASA Exoplanet & Solar System Database with Earth-Centered Astronomical Coordinates\n")
    f.write("// Validated Kopparapu Habitable Zones & Planetary Equilibrium Temperatures\n")
    f.write("export const CELESTIAL_SYSTEMS = ")
    json.dump(all_systems, f, separators=(',', ':'), ensure_ascii=False)
    f.write(";\n")

print(f"Generated systems_data.js successfully with {len(all_systems)} systems.")
