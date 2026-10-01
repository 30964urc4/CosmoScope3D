import urllib.request
import json
import ssl
import sys
import os
import math

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = """
SELECT hostname, pl_name, sy_snum, sy_pnum, sy_dist, ra, dec, glon, glat, st_teff, st_rad, st_mass, st_spectype, pl_rade, pl_bmasse, pl_orbper, pl_orbsmax, pl_eqt, discoverymethod, disc_year
FROM pscomppars
WHERE sy_pnum > 0
"""

url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + urllib.parse.quote(query) + "&format=json"

print("Fetching from NASA Exoplanet Archive with Astronomical Coordinates...")

def format_ra(deg):
    if deg is None: return "00h 00m 00s"
    hrs = deg / 15.0
    h = int(hrs)
    m = int((hrs - h) * 60)
    s = round(((hrs - h) * 60 - m) * 60, 1)
    return f"{h:02d}h {m:02d}m {s:04.1f}s"

def format_dec(deg):
    if deg is None: return "+00° 00' 00\""
    sign = "+" if deg >= 0 else "-"
    abs_deg = abs(deg)
    d = int(abs_deg)
    m = int((abs_deg - d) * 60)
    s = round(((abs_deg - d) * 60 - m) * 60, 1)
    return f"{sign}{d:02d}° {m:02d}' {s:04.1f}\""

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=40) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(f"Retrieved {len(data)} exoplanet records.")
        
        systems = {}
        for row in data:
            host = row.get('hostname')
            if not host:
                continue
            if host not in systems:
                st_teff = row.get('st_teff') or 5778.0
                st_rad = row.get('st_rad') or 1.0
                lum = (st_rad ** 2) * ((st_teff / 5778.0) ** 4)
                t_diff = st_teff - 5780.0
                
                # Kopparapu et al. (2013/2014) polynomial coefficients
                seff_in_opt = max(0.9, min(3.0, 1.7763 + 1.4335e-4 * t_diff))
                seff_out_opt = max(0.18, min(0.5, 0.3207 + 5.5471e-5 * t_diff))
                
                hz_inner = max(0.005, round(math.sqrt(lum / seff_in_opt), 4))
                hz_outer = max(hz_inner + 0.005, round(math.sqrt(lum / seff_out_opt), 4))
                
                dist_pc = row.get('sy_dist')
                dist_ly = round(dist_pc * 3.26156, 1) if dist_pc else None
                
                ra_deg = row.get('ra')
                dec_deg = row.get('dec')
                
                # Cartesian coordinates (Earth as origin [0,0,0], in Light-Years)
                cart_x, cart_y, cart_z = None, None, None
                if dist_ly and ra_deg is not None and dec_deg is not None:
                    ra_rad = math.radians(ra_deg)
                    dec_rad = math.radians(dec_deg)
                    cart_x = round(dist_ly * math.cos(dec_rad) * math.cos(ra_rad), 2)
                    cart_y = round(dist_ly * math.cos(dec_rad) * math.sin(ra_rad), 2)
                    cart_z = round(dist_ly * math.sin(dec_rad), 2)

                systems[host] = {
                    "name": host,
                    "starsCount": row.get('sy_snum') or 1,
                    "planetsCount": row.get('sy_pnum') or 1,
                    "distanceLy": dist_ly,
                    "distancePc": round(dist_pc, 2) if dist_pc else None,
                    "raDeg": round(ra_deg, 4) if ra_deg is not None else None,
                    "decDeg": round(dec_deg, 4) if dec_deg is not None else None,
                    "raHms": format_ra(ra_deg),
                    "decDms": format_dec(dec_deg),
                    "glonDeg": round(row.get('glon'), 2) if row.get('glon') is not None else None,
                    "glatDeg": round(row.get('glat'), 2) if row.get('glat') is not None else None,
                    "coordsEarth": {
                        "x": cart_x,
                        "y": cart_y,
                        "z": cart_z
                    },
                    "starTeff": st_teff,
                    "starRadius": st_rad,
                    "starMass": row.get('st_mass') or 1.0,
                    "starSpecType": row.get('st_spectype') or 'G',
                    "hzInner": hz_inner,
                    "hzOuter": hz_outer,
                    "planets": []
                }
            
            pl_rade = row.get('pl_rade') or 1.0
            pl_orbper = row.get('pl_orbper') or 10.0
            pl_orbsmax = row.get('pl_orbsmax')
            if not pl_orbsmax and pl_orbper:
                m_star = row.get('st_mass') or 1.0
                pl_orbsmax = round(((pl_orbper / 365.25) ** (2/3)) * (m_star ** (1/3)), 4)

            if pl_rade < 1.25:
                pl_type = "Terrestre / Rocoso"
            elif pl_rade < 2.0:
                pl_type = "Super-Tierra"
            elif pl_rade < 6.0:
                pl_type = "Sub-Neptuno / Neptuniano"
            else:
                pl_type = "Gigante Gaseoso (Joviano)"

            hz_in = systems[host]["hzInner"]
            hz_out = systems[host]["hzOuter"]
            in_hz = False
            if pl_orbsmax:
                in_hz = (hz_in <= pl_orbsmax <= hz_out)

            raw_teq = row.get('pl_eqt')
            if raw_teq:
                calc_teq = int(round(raw_teq))
            elif pl_orbsmax and pl_orbsmax > 0:
                # Equilibrium temperature calculation
                st_t = systems[host]["starTeff"] or 5778.0
                st_r = systems[host]["starRadius"] or 1.0
                calc_teq = int(round(st_t * math.sqrt(st_r / pl_orbsmax) * 0.0441))
            else:
                calc_teq = 250

            systems[host]["planets"].append({
                "name": row.get('pl_name'),
                "radiusEarth": round(pl_rade, 2),
                "massEarth": round(row.get('pl_bmasse'), 2) if row.get('pl_bmasse') else None,
                "orbitalPeriodDays": round(pl_orbper, 2),
                "semiMajorAxisAu": round(pl_orbsmax, 4) if pl_orbsmax else 0.5,
                "eqTempK": calc_teq,
                "discoveryMethod": row.get('discoverymethod') or 'Tránsito',
                "discoveryYear": row.get('disc_year'),
                "type": pl_type,
                "inHabitableZone": in_hz
            })

        systems_list = list(systems.values())
        print(f"Processed {len(systems_list)} unique star systems with astronomical coordinates.")
        
        with open("nasa_systems.json", "w", encoding="utf-8") as f:
            json.dump(systems_list, f, indent=2)
        print("Saved to nasa_systems.json successfully.")

except Exception as e:
    print(f"Error fetching from NASA: {e}", file=sys.stderr)
