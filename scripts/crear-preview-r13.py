from pathlib import Path
from html import escape
import json
base=Path(__file__).resolve().parents[1]
preview=base/'preview';preview.mkdir(exist_ok=True)
rows=json.loads((base/'src/jarcar-v3/data/vehicles.seed.json').read_text())['vehicles']
byid={x['id']:x for x in rows}
show=['ford-f150-raptor-2019','jeep-wrangler-sahara-2010','mini-aceman-s-2025','chevrolet-colorado-ltz-2024','toyota-cressida-1984','bmw-325i-2012']
route='../public/jarcar-v3/vehicles/'

def img(id):
    for key in ['-01-1280.webp','-01-960.webp','-01-720.webp']:
        f=base/'public/jarcar-v3/vehicles'/f'{id}{key}'
        if f.exists():return route+f.name
    return ''

def eur(x):return '₡'+format(x['precioCRC'],',').replace(',',' ')

def card(id,idx):
    x=byid[id]; name=escape(f"{x['marca']} {x['modelo']}")
    image=img(id)
    return f'''<article class="ja-cc j13-vehicle {'j13-vehicle-principal' if idx==0 else ''}"><div class="ja-cc-image-frame"><a class="ja-cc-image-link" href="#"><div class="ja-cc-picture jp-picture"><img src="{image}"></div><span class="j13-photo-caption">JARCAR / {x['anio']}</span><span class="ja-cc-photo-count">▣ 1 / 8</span></a><button class="r9-quick-open">◉ Vista rápida</button><div class="j13-card-photo-controls"><button>‹</button><button>›</button></div><button class="ja-cc-save">♡</button></div><div class="ja-cc-info"><div class="ja-cc-index"><span>JARCAR MOTORS</span><span>{x['anio']}</span></div><h2><a>{name}</a></h2><div class="ja-cc-details"><strong>{eur(x)}</strong></div><div class="j13-card-meta"><span>Fotografías reales</span><span>Consultá disponibilidad</span></div><div class="ja-cc-actions"><button>＋ Comparar</button><a>Ver ficha ↗</a></div></div></article>'''

hero=byid['ford-f150-raptor-2019']
css=''.join(f'<link rel="stylesheet" href="../src/jarcar-v4/{name}">' for name in ['estudio.css','rebirth.css','catalog.css','r7.css','r9.css','r12-design.css','r13-catalog.css'])
body='''<div class="j13-catalog ja-catalog" data-j13="true"><section class="j13-opening"><div class="ja-frame j13-opening-layout"><div class="j13-opening-copy"><span class="j13-eyebrow">JARCAR MOTORS <span> / </span> COLECCIÓN MULTIMARCA</span><h1>ENCONTRÁ<br><em>LO QUE TE</em><br>MUEVE<span class="j13-end-dot">.</span></h1><p>De la ciudad a la montaña. De tu primer carro al que siempre quisiste. Explorá cada unidad a tu manera.</p><div class="j13-opening-bottom"><span><strong>35</strong><small>vehículos anunciados</small></span><a>Explorar la colección →</a></div></div><div class="j13-opening-media"><div class="j13-opening-frame"><div class="j13-opening-photo jp-picture"><img src="'''+img(hero['id'])+'''"/></div></div><div class="j13-opening-photo-title"><div><small>UNIDAD DESTACADA / 01</small><strong>Ford F150 Raptor</strong><span>2019 · ₡29 000 000</span></div><a>↗</a></div></div></div><div class="ja-frame j13-opening-chooser"><span>EN FOCO</span><button aria-pressed="true"><span>01</span>Ford F150 Raptor</button><button><span>02</span>MINI Aceman S</button><button><span>03</span>Toyota Cressida</button><button><span>04</span>Chevrolet Colorado</button></div></section><div class="ja-frame ja-c-inner"><header class="ja-c-heading"><div><span class="j13-section-label">EXPLORÁ / JARCAR MOTORS</span><h2>La colección.</h2><p>Una selección con distintos estilos, presupuestos y maneras de conducir.</p></div></header><section class="ja-c-machine"><div class="ja-c-filter-grid"><label class="ja-c-search"><span>Buscar por marca o modelo</span><span class="ja-c-search-control"><input placeholder="Hilux, Civic, Toyota..."/></span></label><label class="ja-c-select"><span>Marca</span><span class="ja-c-select-control"><select><option>Todas</option></select></span></label><label class="ja-c-select"><span>Presupuesto máximo</span><span class="ja-c-select-control"><select><option>Sin límite</option></select></span></label><button class="ja-c-more">Más filtros</button></div></section><div class="ja-c-types"><button aria-pressed="true">Todos</button><button>Pickups</button><button>SUV</button><button>Eléctricos</button><button>Sedanes</button><button>Clásicos</button></div><section class="ja-c-results"><div class="ja-c-resultbar"><p><strong>35</strong> vehículos</p><div class="j13-result-tools"><div class="j13-view-switch"><button aria-pressed="true">▦ Galería</button><button>☰ Índice</button></div><label class="ja-c-sort ja-c-select"><span>Ordenar por</span><select><option>Selección Jarcar</option></select></label></div></div><div class="ja-c-grid j13-products" data-view="editorial" data-opening="false">'''+''.join(card(x,i) for i,x in enumerate(show))+'''<div class="j13-collection-pause"><div><span>JARCAR / MÁS QUE UNA BÚSQUEDA</span><h2>NO TODOS<br>BUSCAMOS <em>LO MISMO.</em></h2><p>Explorá por estilo, guardá tus favoritos o compará hasta tres vehículos en un solo lugar.</p></div><a>Descubrí tu ruta ↗</a><span class="j13-pause-mark">J.</span></div></div></section></div></div>'''
html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jarcar R13 — Inspección estática</title>'+css+'<style>body{margin:0}header.sim{height:72px;background:#101c16;display:flex;align-items:center;justify-content:space-between;padding:0 var(--edge);color:white;font:700 12px var(--body)}header.sim strong{font:800 32px var(--display)}header.sim span{letter-spacing:.08em}</style></head><body><header class="sim"><strong>jarcar<span style="color:#e9ef79">.</span></strong><span>INVENTARIO　 ·　 TU RUTA　 ·　 NOSOTROS　 ·　 COMPARADOR</span></header>'+body+'</body></html>'
(preview/'R13_INVENTARIO_INSPECCION_ESTATICA.html').write_text(html)
print(preview/'R13_INVENTARIO_INSPECCION_ESTATICA.html')
